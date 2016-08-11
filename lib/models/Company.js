/**
 * @file Created by austin on 7/20/16.
 */

const User = require('./User');
const NotFoundError = require('./errors/NotFoundError');
const PostalAddress = require('./PostalAddress');
const firebase = require('firebase');

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
     * @param {string} id
     * @param {*} data
     */
  constructor(id, data) {
      /**
       * @type {string}
       */
    this.id = id;
    this.type = data.type;
    this.name = data.name;
    this.state = data.state;
    this.location = new PostalAddress(data.location);
    this.users = data.users;
  }

  /**
   * Query firebase for a document with a given id
   * @param id
   * @returns {firebase.Promise<Document>}
   */
  static getById(id) {
    const db = firebase.database();
    const companyDbRef = db.ref('companies');
    return companyDbRef.child(id).once('value')
      .then((snapshot) => { // eslint-disable-line arrow-body-style
        return new Promise((fulfill, reject) => {
          const data = snapshot.val();
          if (!data) reject(new NotFoundError(`Document:${this.id}`)); // couldn't find user
          fulfill(new Company(id, data));
        });
      });
  }
}

module.exports = Company;
