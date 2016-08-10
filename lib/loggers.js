/**
 * Created by austin on 8/9/16.
 * @file Loggers for both debugging and http requests
 */

// Using the command line arguments to determine env
const winston = require('winston');
const expressWinston = require('express-winston');
const fs = require('fs');

let httpLogger;
let logger;

// Create the log directory to store the logfiles
if (!fs.existsSync('./logs')) {
  fs.mkdirSync('./logs');
}

function generateLogger(env) {
  const config = require('../config/config')(env);  // eslint-disable-line global-require
  switch (env) {
    case 'development':
      logger = new winston.Logger({
        transports: [
          new winston.transports.Console({
            colorize: true,
          }),
        ],
      });
      httpLogger = expressWinston.logger({
        winstonInstance: logger,
        expressFormat: true,
        colorize: true,
      });
      break;
    default: // Production
      logger = new winston.Logger({
        transports: [
          new winston.transports.File({
            filename: `./logs/${config.consoleLogFile}`,
            timestamp: true,
          }),
        ],
      });
      httpLogger = expressWinston.logger({
        transports: [
          new winston.transports.File({
            filename: `./logs/${config.accessLogFile}`,
            timestamp: true,
          }),
        ],
        expressFormat: true,
        colorize: true,
      });
  }
  return {
    logger,
    httpLogger,
  };
}

module.exports = generateLogger;

