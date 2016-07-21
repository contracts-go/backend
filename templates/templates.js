/**
 * Created by austin on 7/20/16.
 */

const handlebars = require('handlebars');
const fs = require('fs');

const templates = {
  'stevens-mutual': handlebars.compile(fs.readFileSync(`${__dirname}/stevens-mutual.hbs`, 'utf8')),
};

module.exports = templates;
