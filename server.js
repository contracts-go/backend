/**
 * Created by austin on 7/20/16.
 * @file The main file for our small backend mailer. Takes care of routes and configuration
 */

// Use the command line args to determine env if not already there
// Useful for testing environments
if (!process.env.CONTRACTS_ENV) {
  process.env.CONTRACTS_ENV = process.argv[2];
}
// Configuration
const config = require('./config/config')();
// Data Models
const Document = require('./lib/models/Document');
const User = require('./lib/models/User');
// Errors
const errors = require('./lib/models/errors/errors');
// Files / emails
const fs = require('fs');
// Database
const firebase = require('firebase');
// Server
const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');
const app = express();
// Other necessary functions
const utils = require('./lib/utils');

// Create the tmp directory to store the ndas for emailing
if (!fs.existsSync('./tmp')) {
  fs.mkdirSync('./tmp');
}

app.set('env', config.env);

// Logging
const loggers = require('./lib/loggers')(config.env);
const logger = loggers.logger;

// Middleware for the API
// Stores urlencoded and application/json into the request's body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(loggers.httpLogger);
// / Allow Cross Origin Requests from only allowed origins
const corsOptions = {
  /**
   * Test to make sure the origin is in the list of OK domains
   * @param origin
   * @param cb
   */
  origin: (origin, cb) => {
    let isWhiteListed = false;
    for (const domain of config.corsDomains) {
      // Ignore case and match to any of the domains authorized
      if (origin && origin.match(new RegExp(domain, 'i'))) {
        isWhiteListed = true;
        // Break on first success
        break;
      }
    }
    cb(null, isWhiteListed);
  },
};
app.use(cors(corsOptions));

// DATABASE SETUP
firebase.initializeApp({
  serviceAccount: config.firebaseCreds,
  databaseURL: config.databaseUrl,
});
firebase.database.enableLogging(logger.database);

app.get('/', (req, res) => {
  res.status(200).send({ message: 'Welcome to the start of world peace.' });
});

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
 *          title: NotFoundResponse
 *          properties:
 *            message:
 *              type: string
 *              description: 'Message about which property was not found in the database.'
 */
app.post('/email', (req, res, next) => {
  const data = req.body;
  const docId = data.document;
  const senderId = data.sender;
  const recipientId = data.recipient;
  const emailTemplate = data.template;
  // Start with getting the document
  let doc;
  let sender;
  let recipient;
  let docxFile;

  // This needs to be greatly reduced in db calls
  /*
   Todo: Ways to make faster:
   - if sending to self --> only need to query for one user
   */
  Document.getById(docId)
    .then((docObj) => {
      doc = docObj;
      logger.debug('Got Document');
      // For now we will just fetch all the data about the document
      return doc.fetchData();
    })
    .then(() => {
      // Got all the data for the document
      return User.getById(senderId);
    })
    .then((senderObj) => {
      sender = senderObj; // The user object from sender
      logger.debug('Got Sender');
      return User.getById(recipientId);
    })
    .then((recipientObj) => {
      recipient = recipientObj;
      logger.info(doc);

      // Now that we have some data ...
      // Authenticate request:
      //  Needs:
      //  Everybody exists --> thrown through query promises
      //  Sender has access to document
      if (!sender.hasAccess(doc)) {
        throw new errors.UnauthorizedError({
          user: sender.id,
          action: `email the document:${doc.id}`,
        });
      }
      // If we've made it this far --> We're all good to build the document!
      return doc.generateDocx();
    })
    .then((docx) => {
      return utils.createDocxFile(docx);
    })
    .then((file) => {
      docxFile = file;
      const mailHtml = utils.generateMailHtml(
        emailTemplate,
        sender,
        recipient,
        doc.companyContact.company,
        doc
      );
      // don't cc when sending to self
      const cc = (recipient.email === sender.email ? '' : sender.email);
      // Email it
      return utils.sendMail({
        to: recipient.email,
        subject: `Contract from ${sender.name}`,
        cc,
        html: mailHtml,
        attachments: [
          {
            filename: `${doc.title}.docx`,
            content: fs.createReadStream(docxFile.path),
          },
        ],
      });
    })
    .then(() => {
      // Done with file, remove it
      if (docxFile) {
        fs.unlink(docxFile.path);
      }
      res.status(201).send({ message: 'Sent!' });
    })
    .catch((error) => {
      // Equally so done with file, remove it
      if (docxFile) {
        fs.unlink(docxFile.path);
      }
      // Handle the error down
      next(error);
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
  logger.log('info', `Running on port ${config.port} in ${app.get('env')} mode.`);
});

// Exported for unit testing and others
module.exports = server;
