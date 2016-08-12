/**
 * Created by austin on 8/9/16.
 * @file exposes all config files in one object
 */

// Load the config files. Keep the passwords in the private.config.json
const reload = require('require-reload')(require);

/**
 * Dynamically get all configuration file objects
 * @param {string} env
 * @returns {*} configuration object
 */
function configuration(env) {
  // Defaults to using the env variable but allows dynamic loading
  if (!env) env = process.env.CONTRACTS_ENV;  // eslint-disable-line
  let config = reload('./config.json');
  let privateConfig = reload('./private.config.json');
  let firebaseCreds;
  // Dynamically get the config off passed environment
  switch (env) {
    case 'dev':
    case 'development': {
      config = config.development;
      privateConfig = privateConfig.development;
      firebaseCreds = reload('./private.devFirebaseCreds.json');
      break;
    }
    case 'testing': {
      config = config.development;
      config.env = 'testing'; // Manual overwrite, better than a whole new obj
      privateConfig = privateConfig.development;
      config.databaseURL = 'ws://dummy.firebaseio.test:5001';
      firebaseCreds = {
        private_key: 'fake',
        client_email: 'fake',
      };
      break;
    }
    default: {  // Default to production mode
      config = config.production;
      privateConfig = privateConfig.production;
      firebaseCreds = reload('./private.firebaseCreds.json');
    }
  }
  /**
   * The SMTP configuration for mail
   * @type {{host: string, port: number, secure: boolean, auth: {user: string, pass: string}}}
   */
  const smtpConfig = {
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: privateConfig.mail.username,
      pass: privateConfig.mail.password,
    },
  };
  // Link all configs in the main config object
  config.private = privateConfig;
  config.firebaseCreds = firebaseCreds;
  config.smtp = smtpConfig;
  return config;
}

/**
 * Gets the configuration based on the environment passed
 * @type {function}
 */
module.exports = configuration;
