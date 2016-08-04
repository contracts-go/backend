/**
 * Created by austin on 7/20/16.
 */

const handlebars = require('handlebars');
const fs = require('fs');

handlebars.registerPartial('signPartial', fs.readFileSync(
    `${__dirname}/stevens-sign-partial.hbs`, 'utf8'
));

const templates = {
  'stevens-mutual': handlebars.compile(fs.readFileSync(
    `${__dirname}/stevens-mutual.hbs`, 'utf8')),
  'stevens-disclosing': handlebars.compile(
    fs.readFileSync(`${__dirname}/stevens-disclosing.hbs`, 'utf8')),
  'stevens-receiving': handlebars.compile(
    fs.readFileSync(`${__dirname}/stevens-receiving.hbs`, 'utf8')),
};

module.exports = templates;
