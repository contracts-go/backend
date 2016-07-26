/**
 * Created by austin on 7/20/16.
 */

// Load the config files. Keep the passwords in the private.config.json
const config = require('./config.json');
const privateConfig = require('./private.config.json');

const NDA = require('./models/NDA');
const PI = require('./models/PI');
const Project = require('./models/Project');
const Company = require('./models/Company');
const User = require('./models/User');

const fs = require('fs');
const officegen = require('officegen');
const nodemailer = require('nodemailer');
const emailTemplater = require('./email-templates/email-templates');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cors = require('cors');
const app = require('express')();

app.set('env', config.env);

// Middleware for the API
// Stores urlencoded and application/json into the request's body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
// Allow Cross Origin Requests
app.use(cors());

// Logs http requests made to server
if (app.get('env') === 'production') {
  const logFile = fs.createWriteStream('./access.log', { flags: 'a' });
  app.use(morgan('combined', { stream: logFile }));
} else {
  app.use(morgan('dev'));
}

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
/*
emailTransporter.verify((err, success) => {
  if (err) {
    console.log('Problem verifying the email transport!');
  } else {
    console.log('Successfully verified the email transport!');
  }
});
*/

/**
 * @see http://nodemailer.com/2-0-0-beta/setup-smtp/
 * @param mail
 */
function sendMail(mail) {
  return emailTransporter.sendMail({
    from: privateConfig.mail.username,
    to: mail.to,
    subject: mail.subject,
    html: mail.html,
    attachments: mail.attachments
  });
}

/**
 * @api {post} /generate
 *
 * @apiSuccess {string} nda
 */
app.post('/generate', (req, res, next) => {
  const data = req.body;
  let nda;
  let date;

  // Defaults to today
  if (data.date) {
    date = new Date(data.date);
  } else {
    date = new Date();
  }

  // Create the NDA
  try {
    const ndaType = data.type;
    const pi = new PI(data.pi.name, data.pi.title);
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
    return next(err);
  }

  const ndaText = nda.generate();
  // Send an email with the NDA if supplied
  if (data.emailTo) {
    const admin = new User(data.emailTo.name, data.emailTo.email);
    const doc = officegen('docx');

    const page = doc.createP();
    page.addText(ndaText);

    const docFile = fs.createWriteStream(`${__dirname}/tmp/nda-${(new Date()).toISOString()}.docx`);

    doc.on('error', (error) => {
      console.log(error);
    });

    docFile.on('error', (error) => {
      console.log(error);
    });
    docFile.on('close', () => {
      sendMail({
        to: admin.email,
        subject: `New NDA Request from ${data.pi.name}`,
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
            filename: 'nda.docx',
            content: fs.createReadStream(docFile.path),
          },
        ],
      }).then(() => {
        // Success
        console.log('Sent email');
      }).catch((error) => {
        // Error
        console.log(`Error sending email: ${error}`);
      });
    });
    doc.generate(docFile);
  }

  res.status(200).send({ nda: ndaText });
});

if (app.get('env') === 'production') {
  // PRODUCTION

  // Error handler
  //  Don't send the stack back
  app.use((err, req, res, next) => {
    res.status(err.status || 500).send({
      message: err.message,
      error: {},
    });
  });
} else {
  // DEVELOPMENT
  // Error handler
  app.use((err, req, res, next) => {
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

// Exported for unit testing
module.exports = server;
