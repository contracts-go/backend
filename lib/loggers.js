/**
 * Created by austin on 8/9/16.
 * @file Loggers for both debugging and http requests
 */

const config = require('../config/config');
const winston = require('winston');
const expressWinston = require('express-winston');
const fs = require('fs');

let httpLogger;
let logger;

// Create the log directory to store the logfiles
if (!fs.existsSync('./logs')) {
  fs.mkdirSync('./logs');
}

switch (config.env) {
  case 'development':
    logger = new winston.Logger({
      transports: [
        new winston.transports.Console(),
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

module.exports = {
  logger,
  httpLogger,
};
