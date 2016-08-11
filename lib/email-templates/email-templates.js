/**
 * @file Created by austin on 7/26/16.
 */

const handlebars = require('handlebars');
const hbLayouts = require('handlebars-layout');
const fs = require('fs');

// Allows us to build off the base template and no rewrite
handlebars.registerHelper(hbLayouts(handlebars));
handlebars.registerPartial('base', fs.readFileSync(`${__dirname}/base.hbs`, 'utf8'));

const templates = {
  toAdmin: handlebars.compile(fs.readFileSync(`${__dirname}/toAdmin.hbs`, 'utf8')),
  toSelf: handlebars.compile(fs.readFileSync(`${__dirname}/toSelf.hbs`, 'utf8')),
  toCompany: handlebars.compile(fs.readFileSync(`${__dirname}/toCompany.hbs`, 'utf8')),
};

module.exports = templates;
