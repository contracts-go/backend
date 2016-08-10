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
// Server + Logging
const morgan = require('morgan');
const logger = require('winston');
const bodyParser = require('body-parser');
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
// Logs all console output to a file
logger.add(logger.transports.File, { filename: config.consoleLogFile });
logger.remove(logger.transports.Console);

// DATABASE SETUP
firebase.initializeApp({
  serviceAccount: './private.firebaseCreds.json',
  databaseURL: 'https://contracts-go.firebaseio.com',
});
// const db = firebase.database();

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
 * Sents the email through the email transporter
 * @see http://nodemailer.com/2-0-0-beta/setup-smtp/
 * @param {object} mail
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
 * /email:
 *  post:
 *    description: |
 *      Emails the document as a docx file.
 *    parameters:
 *      - name: emailReqBody
 *        in: body
 *        description: All those good things necessary to email a doc.
 *        required: true
 *        schema:
 *          title: Email Body
 *          type: object
 *          properties:
 *            document:
 *              type: string
 *              description: |
 *                A udid string (from Firebase) for the document to be sent.
 *    responses:
 *      201:
 *        description: Successfully Sent email
 *        schema:
 *          title: SuccessResponse
 *          properties:
 *            message:
 *              type: string
 *              description: 'Message telling of the success. Grand success.'
 *      401:
 *        description: Unauthorized to send email
 *        schema:
 *          title: UnauthorizedResponse
 *          type: object
 *          properties:
 *            message:
 *              type: string
 *              description: 'Message about why someone is not authorized.'
 *      404:
 *        description: Not found
 *        schema:
 *          title: NotFound Response
 *          properties:
 *            message:
 *              type: string
 *              description: 'Message about which property was not found in the database.'
 */
app.post('/email', (req, res) => {
  // Authenticate request?
  const data = req.body;
  // Retrieve NDA info from database
  const ndaID = data.ndaID;
  const emailToUser = new User(data.emailTo.name, data.emailTo.email);

  const ndaRef = ndasDbRef.ref(ndaID); // eslint-disable-line no-unused-vars
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
        logger.log('Sent email');
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
  app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
    logger.error(err);
    res.status(err.status || 500).send({
      message: err.message,
      error: {}, //  Don't send the stack back
    });
  });
} else {
  // DEVELOPMENT
  // Error handler
  app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
    logger.error(err);
    res.status(err.status || 500).send({
      message: err.message,
      error: err.stack,
    });
  });
}

// Runs the app
const server = app.listen(config.port, () => {
  logger.log(`Running on port   ${config.port}`);
});

// Exported for unit testing and others
module.exports = server;
