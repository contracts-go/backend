/**
 * @file Created by austin on 7/20/16.
 */

const NotFoundError = require('./errors/NotFoundError');
const PostalAddress = require('./PostalAddress');
const reload = require('require-reload');
const User = reload('./User');  // The fuck we have to reload this for @node?
const firebase = require('firebase');

/**
 * @swagger
 * definition:
 *   Company:
 *     required:
 *       - type
 *       - name
 *       - state
 *       - _location
 *       - contact
 *     properties:
 *       type:
 *         type: string
 *       name:
 *         type: string
 *       state:
 *         type: string
 *       _location:
 *         type: object
 *       contact:
 *         type: object
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
    this._location = new PostalAddress(data.location);
    this.users = data.users ? Object.keys(data.users) : []; // Fblist to array
    this.contact = new User('', data.contact);
  }

  get location() {
    return this._location.readable;
  }

  /**
   * Query firebase for a company with a given id
   * @param id
   * @returns {firebase.Promise<Company>}
   */
  static getById(id) {
    const db = firebase.database();
    const companyDbRef = db.ref('companies');
    return companyDbRef.child(id).once('value')
      .then((snapshot) => { // eslint-disable-line arrow-body-style
        return new Promise((fulfill, reject) => {
          const data = snapshot.val();
          if (!data) reject(new NotFoundError({ resource: `Company:${id}` })); // couldn't find user
          fulfill(new Company(id, data));
        });
      });
  }
}

module.exports = Company;
