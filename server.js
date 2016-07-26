/**
 * Created by austin on 7/20/16.
 */

const config = require('./config');

const NDA = require('./models/NDA');
const PI = require('./models/PI');
const Project = require('./models/Project');
const Company = require('./models/Company');

const fs = require('fs');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const express = require('express');
const app = express();

app.set('env', config.env);

// Middleware for the API
// Stores application/json in request's body
app.use(bodyParser.json());

// Logs http requests made to server
if (app.get('env') === 'production') {
  const logFile = fs.createWriteStream('./access.log', { flags: 'a' });
  app.use(morgan('combined', { stream: logFile }));
} else {
  app.use(morgan('dev'));
}

/**
 * @api {post} /generate
 *
 * @apiSuccess {string} nda
 */
app.post('/generate', (req, res, next) => {
  const data = req.body;
  let date;

  if (data.date) {
    date = new Date(data.date);
  } else {
    date = new Date();
  }

  try {
    const ndaType = data.type;
    const pi = new PI(data.pi.name, data.pi.title);
    const company = new Company(
      data.company.type, data.company.name, data.company.state, data.company.location);
    const project = new Project(data.project.industry, data.project.description);
    const nda = new NDA(ndaType, pi, company, project, date);
    res.status(200).send({ nda: nda.generate() });
  } catch (err) {
    if (err instanceof TypeError) {
      // If the problem is missing data in the request, mark as a BAD REQUEST
      err.status = 400;
    }
    return next(err);
  }
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
