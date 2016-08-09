/**
 * @file Created by austin on 7/26/16.
 */

const handlebars = require('handlebars');
const fs = require('fs');

const templates = {
  'new-nda': handlebars.compile(fs.readFileSync(
    `${__dirname}/new-nda.hbs`, 'utf8')),
};

module.exports = templates;
