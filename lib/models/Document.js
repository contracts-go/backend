/**
 * @file Created by austin on 7/20/16.
 */
const Project = require('./Project');
const htmlToDocx = require('html-docx-js');
const moment = require('moment');
const dateFormat = 'Do day of MMMM, YYYY';  // The 14th day of July, 2016

/**
 * @swagger
 * definition:
 *   Document:
 *     required:
 *       - type
 *       - pi
 *       - company
 *       - project
 *       - date
 *     properties:
 *       type:
 *         type: string
 *         enum:
 *         - mutual
 *         - receiving
 *         - disclosing
 *       pi:
 *         $ref: '#/definitions/PI'
 *       company:
 *         $ref: '#/definitions/Company'
 *       project:
 *         $ref: '#/definitions/User'
 *       date:
 *         type: string
 *         format: date
 *         description: 'Defaults to current time'
 *       otherEntities:
 *         type: string
 *
 */
class Document {

  /**
   * @param {{}} data
   */
  constructor(data) {
    this.type = data.type;
    this.project = new Project(data.project);
    this.date = new Date(data.date);
    this.patchUrl = data.patchUrl;
    this.templateUrl = data.templateUrl;
    this.status = data.status;
    this.creator = data.creator;
    this.admin = data.admin;
    this.companyContact = data.companyContact;
    this.createdAt = new Date(data.createdAt);
  }

  /**
   * Fills the template with the information
   * @returns {string}
   */
  generateHTML() {
    return '';
  }

  /**
   * Creates a Docx Zipped file
   * @returns {ArrayBuffer}
   */
  generateDocx() {
    const ndaText = this.generateHTML();
    return htmlToDocx.asBlob(ndaText);
  }
}

module.exports = Document;
