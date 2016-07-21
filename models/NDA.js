/**
 * Created by austin on 7/20/16.
 */

const templates = require('../templates/templates');
const moment = require('moment');
const dateFormat = 'Do of MMMM, YYYY';

/**
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
    this.date = date;

    switch (this.type) {
      case 'mutual':
        this.template = templates['stevens-mutual'];
        break;
      case 'recipient':
        this.template = templates['stevens-recipient'];
        break;
      case 'disclosing':
        this.template = templates['stevens-disclosing'];
        break;
      default:
        throw new Error('NDAs must be either mutual, recipient, or disclosing');
    }
  }

  /**
   * Fills the template with the information
   * @returns {string}
   */
  generate() {
    return this.template({
      pi: this.pi,
      company: this.company,
      project: this.project,
      dateString: moment(this.date).format(dateFormat),
    });
  }
}

module.exports = NDA;
