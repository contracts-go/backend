/**
 * Created by austin on 7/20/16.
 */

const config = require('./config');

const NDA = require('./models/NDA');
const PI = require('./models/PI');
const Project = require('./models/Project');
const Company = require('./models/Company');

const bodyParser = require('body-parser');
const morgan = require('morgan');
const express = require('express');
const app = express();

app.use(bodyParser.json());

if (config.env === 'prod') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

app.post('/generate', (req, res) => {
  const data = req.body;
  const pi = new PI(data.pi.name, data.pi.title);
  const company = new Company(
    data.company.type, data.company.name, data.company.state, data.company.location);
  const project = new Project(data.project.industry, data.project.description);
  let date;
  if (data.date) {
    date = new Date(data.date);
  } else {
    date = new Date();
  }
  const nda = new NDA('mutual', pi, company, project, date);
  res.status(200).send({ nda: nda.generate() });
});

app.listen(config.port, () => {
  console.log(`Running on port   ${config.port}`);
});
