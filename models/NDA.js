/**
 * Created by austin on 7/20/16.
 */

const templates = require('../templates/templates');
const moment = require('moment');
const dateFormat = 'Do day of MMMM, YYYY';  // The 14th day of July, 2016

/**
 * @swagger
 * definition:
 *   NDA:
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
class NDA {

  /**
   * @param type
   * @param pi
   * @param company
   * @param project
   * @param date
   * @param otherEntities
   */
  constructor(type, pi, company, project, date = new Date(), otherEntities = []) {
    this.type = type;
    this.pi = pi;
    this.company = company;
    this.project = project;
    this.otherEntities = otherEntities;
    this.date = new Date(date);

    let error;
    switch (this.type) {
      case 'mutual':
        this.template = templates['stevens-mutual'];
        break;
      case 'receiving':
        this.template = templates['stevens-receiving'];
        break;
      case 'disclosing':
        this.template = templates['stevens-disclosing'];
        break;
      default:
        error = new Error('NDAs must be either mutual, receiving, or disclosing');
        error.status = 400;
        throw error;
    }
  }

  /**
   * Fills the template with the information
   * @returns {string}
   */
  generateHTML() {
    return this.template({
      pi: this.pi,
      company: this.company,
      project: this.project,
      dateString: moment(this.date).format(dateFormat),
    });
  }
}

module.exports = NDA;
