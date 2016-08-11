/**
 * Created by austin on 8/9/16.
 * @file Loggers for both debugging and http requests
 */

// Using the command line arguments to determine env
const winston = require('winston');
const expressWinston = require('express-winston');
const fs = require('fs');

// Overwrite the 'notice' level for custom database logging
const levels = winston.config.syslog.levels;
const colors = winston.config.syslog.colors;
delete levels.notice;
delete colors.notice;
levels.database = 5;
colors.database = 'yellow';
winston.addColors(colors);

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
        levels,
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
            name: 'Console Log',
            filename: `./logs/${config.consoleLogFile}`,
            timestamp: true,
          }),
          new winston.transports.File({
            name: 'Database Log',
            filename: `./logs/${config.databaseLogFile}`,
            timestamp: true,
            level: 'database',
          }),
        ],
        levels,
      });
      httpLogger = expressWinston.logger({
        transports: [
          new winston.transports.File({
            name: 'Access Log',
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

