/**
 * @file Created by austin on 7/20/16.
 */

const User = require('./User');

/**
 * @swagger
 * definition:
 *   Company:
 *     required:
 *       - type
 *       - name
 *       - state
 *       - location
 *       - contact
 *     properties:
 *       type:
 *         type: string
 *       name:
 *         type: string
 *       state:
 *         type: string
 *       location:
 *         type: string
 *       contact:
 *         $ref: '#/definitions/User'
 *
 */
class Company {
    /**
     *
     * @param type
     * @param name
     * @param state
     * @param location
     * @param contact
     */
  constructor(type, name, state, location, contact) {
    this.type = type;
    this.name = name;
    this.state = state;
    this.location = location;
    this.contact = new User(contact.name, contact.email);
    this.admin = new User(contact.name, contact.email);
  }
}

module.exports = Company;
