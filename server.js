/**
 * @file Created by austin on 7/20/16.
 */

// Load the config files. Keep the passwords in the private.config.json
const config = require('./config.json');
const privateConfig = require('./private.config.json');
// Data Models
const NDA = require('./lib/models/NDA');
const PI = require('./lib/models/PI');
const Project = require('./lib/models/Project');
const Company = require('./lib/models/Company');
const User = require('./lib/models/User');
// Files / emails
const fs = require('fs');
const nodemailer = require('nodemailer');
const emailTemplater = require('./lib/email-templates/email-templates');
// Database
const firebase = require('firebase');
// Server
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cors = require('cors');
const express = require('express');
const app = express();

app.set('env', config.env);

// Middleware for the API
// Stores urlencoded and application/json into the request's body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// Allow Cross Origin Requests
app.use(cors());

// Logs http requests made to server
if (app.get('env') === 'production') {
  const logFile = fs.createWriteStream('./access.log', { flags: 'a' });
  app.use(morgan('combined', { stream: logFile }));
} else {
  app.use(morgan('dev'));
}

// DATABASE SETUP
firebase.initializeApp({
  serviceAccount: `${__dirname}/private.firebaseCreds.json`,
  databaseURL: 'https://contracts-go.firebaseio.com',
});
const db = firebase.database();
const ndasDbRef = db.ref('ndas');
const usersDbRef = db.ref('users');

// EMAIL SETUP
// Setup the e-mail-er client
const smtpConfig = {
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: privateConfig.mail.username,
    pass: privateConfig.mail.password,
  },
};
const emailTransporter = nodemailer.createTransport(smtpConfig);

// Create the tmp directory to store the ndas for emailing
if (!fs.existsSync(`${__dirname}/tmp`)) {
  fs.mkdirSync(`${__dirname}/tmp`);
}

/**
 * @see http://nodemailer.com/2-0-0-beta/setup-smtp/
 * @param mail
 */
function sendMail(mail) {
  return emailTransporter.sendMail({
    from: privateConfig.mail.username,
    to: mail.to,
    cc: mail.cc,
    subject: mail.subject,
    html: mail.html,
    attachments: mail.attachments,
  });
}

/**
 * @swagger
 * parameter:
 *  generateBody:
 *    name: generateBody
 *    description: Body for the generate request.
 *    in: body
 *    required: true
 *    schema:
 *      type: object
 *
 */
/**
 * @swagger
 * /generate:
 *  post:
 *    description: Generate and email a NDA Document
 *    produces:
 *      - application/json
 *    parameters:
 *       - name: company
 *         description: Company involved.
 *         in: body
 *         required: true
 *         schema:
 *          $ref: '#/definitions/Company'
 *       - name: pi
 *         description: PI involved.
 *         in: body
 *         required: true
 *         schema:
 *          $ref: '#/definitions/PI'
 *       - name: emailTo
 *         description: The contact/admin to email the generated document to.
 *         in: body
 *         required: false
 *         schema:
 *          $ref: '#/definitions/User'
 *    responses:
 *      200:
 *        description: Document created
 */
app.post('/generate', (req, res, next) => {
  const data = req.body;
  let nda;
  let date;

  // Data section

  // Defaults to today
  if (data.date) {
    date = new Date(data.date);
  } else {
    date = new Date();
  }

  // Create the NDA
  try {
    const ndaType = data.type;
    const pi = new PI(data.pi.name, data.pi.title, data.pi.email);
    const company = new Company(
      data.company.type,
      data.company.name,
      data.company.state,
      data.company.location,
      data.company.contact
    );
    const project = new Project(data.project.industry, data.project.description);
    // Fill the nda
    nda = new NDA(ndaType, pi, company, project, date);
  } catch (err) {
    // Object Creation Errors
    if (err instanceof TypeError) {
      // If the problem is missing data in the request, mark as a BAD REQUEST
      err.status = 400;
      if (app.get('env') !== 'production') {
        console.log(err);
      }
    }
    throw err;
  }
  const ndaText = nda.generateHTML();
  // Email Section
  if (data.emailTo) {
    const admin = new User(data.emailTo.name, data.emailTo.email);

    const wordBuffer = nda.generateDocx();
    const newFileName = `${__dirname}/tmp/nda-${(new Date()).toISOString()}.docx`;

    // Create a .docx temporary file
    const docFile = fs.createWriteStream(newFileName);
    docFile.once('open', () => {
      docFile.write(wordBuffer);
      docFile.end();
    });

    // Event handlers
    docFile.on('error', (error) => {
      console.log(error);
    });
    docFile.on('close', () => {
      sendMail({
        to: admin.email,
        subject: `New NDA Request from ${data.pi.name}`,
        cc: data.pi.email,
        html: emailTemplater['new-nda']({
          company: nda.company,
          pi: nda.pi,
          project: nda.project,
          nda,
          supportEmail: 'contractsgo@gmail.com',
          admin,
        }),
        attachments: [
          {
            filename: `nda-${data.pi.name}-${(new Date()).toDateString()}.docx`,
            content: fs.createReadStream(docFile.path),
          },
        ],
      }).then(() => {
        // Success. Delete the file
        console.log('Sent email');
        fs.unlinkSync(docFile.path);
        res.status(201).send({ nda: ndaText });
      }).catch((error) => {
        // Error. Log The error and Delete the file
        console.log(`Error sending email: ${error}`);
        fs.unlinkSync(docFile.path);
        throw error;  // Sends error to handler
      });
    });
  } else {
    res.status(201).send({ nda: ndaText });
  }
});

app.post('/email', (req, res) => {
  // Authenticate request?
  const data = req.body;
  // Retrieve NDA info from database
  const ndaID = data.ndaID;
  const emailToUser = new User(data.emailTo.name, data.emailTo.email);

  const ndaRef = ndasDbRef.ref(ndaID);
  ndaRef.once('value', (ndaData) => {
    // Lookup PI and others from database

    const nda = new NDA(ndaData);
    // Generate doc
    const docxBuf = nda.generateDocx();
    // Save doc to temp file
    // Create a .docx temporary file
    const tempFileName = `${__dirname}/tmp/nda-${(new Date()).toISOString()}.docx`;
    const docFile = fs.createWriteStream(tempFileName);
    const docxAttachmentName = `nda-${nda.pi.name}-${(new Date()).toDateString()}.docx`;
    docFile.once('open', () => {
      docFile.write(docxBuf);
      docFile.end();
    });

    // Email to recipient
    docFile.on('close', () => {
      sendMail({
        to: emailToUser.email,
        subject: `New NDA Request from ${data.pi.name}`,
        cc: nda.pi.email,
        html: emailTemplater['new-nda']({
          company: nda.company,
          pi: nda.pi,
          project: nda.project,
          nda,
          supportEmail: 'contractsgo@gmail.com',
          emailToUser,
        }),
        attachments: [
          {
            filename: docxAttachmentName,
            content: fs.createReadStream(docFile.path),
          },
        ],
      }).then(() => {
        // Success. Delete the file
        console.log('Sent email');
        fs.unlinkSync(docFile.path);
        res.status(200).send({ status: 'Sent' });
      }).catch((error) => {
        // Error. Log The error and Delete the file
        fs.unlinkSync(docFile.path);
        throw error;  // Sends error to handler
      });
    }, (errorObj) => {
      throw new Error(errorObj);
    });
  });
});


// Error handling must be put at the end (?)
if (app.get('env') === 'production') {
  // PRODUCTION
  // Error handler
  app.use((err, req, res, next) => {
    console.log(err);
    res.status(err.status || 500).send({
      message: err.message,
      error: {}, //  Don't send the stack back
    });
  });
} else {
  // DEVELOPMENT
  // Error handler
  app.use((err, req, res, next) => {
    console.log(err);
    res.status(err.status || 500).send({
      message: err.message,
      error: err.stack,
    });
  });
}

// Runs the app
const server = app.listen(config.port, () => {
  console.log(`Running on port   ${config.port}`);
});

// Exported for unit testing and others
module.exports = server;
