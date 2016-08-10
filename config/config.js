/**
 * Created by austin on 8/9/16.
 * @file exposes all config files in one object
 */

// Load the config files. Keep the passwords in the private.config.json
let config = require('./config.json');
let privateConfig = require('./private.config.json');
const firebaseCreds = require('./private.firebaseCreds.json');

// Get the configuration from the command line
switch (process.argv[2]) {
  case 'dev':
    config = config.development;
    privateConfig = privateConfig.development;
    break;
  default:  // Default to production mode
    config = config.production;
    privateConfig = privateConfig.production;
}

/**
 * The main configuration
 */
module.exports = config;

/**
 * All private configs, like passwords, api keys, etc.
 */
module.exports.private = privateConfig;

/**
 * Service account credentials for firebase
 */
module.exports.firebaseCreds = firebaseCreds;

/**
 * The SMTP configuration for mail
 * @type {{host: string, port: number, secure: boolean, auth: {user: string, pass: string}}}
 */
module.exports.smtpConfig = {
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: privateConfig.mail.username,
    pass: privateConfig.mail.password,
  },
};
