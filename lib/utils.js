/**
 * Created by austin on 8/10/16.
 */

const config = require('../config/config')();
const BadReqError = require('../lib/models/errors/BadRequestError');
const emailTemplates = require('./email-templates/email-templates');
const nodemailer = require('nodemailer');
const fs = require('fs');

// EMAIL SETUP
// Setup the e-mail-er client
const emailTransporter = nodemailer.createTransport(config.smtp);

/**
 * @param {string} template
 * @param {User} sender
 * @param {User} recipient
 * @param {Company} company
 * @param {Document} doc
 */
function generateMailHtml(template, sender, recipient, company, doc) {
  let html;
  switch (template) {
    case 'toAdmin':
      html = emailTemplates.toAdmin({
        doc,
        company,
        pi: sender,
        admin: recipient,
        contact: doc.companyContact,
      });
      break;
    case 'toSelf':
      break;
    case 'toCompany':
      break;
    default:
      throw new BadReqError({message: `Email template "${template}" is not valid.`});
  }
  return html;
}

/**
 * Sends the email through the email transporter
 * @see http://nodemailer.com/2-0-0-beta/setup-smtp/
 * @param {object} mail
 */
function sendMail(mail) {
  return emailTransporter.sendMail({
    from: config.private.mail.username,
    to: mail.to,
    cc: mail.cc,
    subject: mail.subject,
    html: mail.html,
    attachments: mail.attachments,
  });
}

/*
 * Mail Exports
 */
module.exports.generateMailHtml = generateMailHtml;
module.exports.sendMail = sendMail;

/**
 * @param {ArrayBuffer} buffer
 * @return {Promise<File>}
 */
function createDocxFile(buffer) {
  // Create a temp file to store the .docx
  const tempFileName = `./tmp/document-${(new Date()).toISOString()}.docx`;
  const docFile = fs.createWriteStream(tempFileName);
  return new Promise((fulfill, reject) => {
    docFile.once('open', () => {
      docFile.write(buffer);
      docFile.end();
    });
    docFile.on('close', () => {
      fulfill(docFile);
    });
    docFile.on('error', reject);
  })
    .catch((error) => {
      fs.unlink(docFile.path);
      throw error;
    });
}

/*
 * Docx Exports
 */
module.exports.createDocxFile = createDocxFile;
