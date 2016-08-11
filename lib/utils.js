/**
 * Created by austin on 8/10/16.
 */

const config = require('../config/config')();
const emailTemplater = require('./email-templates/email-templates');
const nodemailer = require('nodemailer');

// EMAIL SETUP
// Setup the e-mail-er client
const emailTransporter = nodemailer.createTransport(config.smtp);

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

module.exports.sendMail = sendMail;


