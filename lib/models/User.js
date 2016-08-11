/**
 * @file Created by austin on 7/26/16.
 */

const firebase = require('firebase');
const NotFoundError = require('./errors/NotFoundError');
const Company = require('./Company');

/**
 * @swagger
 * definition:
 *   User:
 *     required:
 *       - name
 *       - email
 *       - type
 *       - company
 *       - documents
 *     properties:
 *       name:
 *         type: string
 *       email:
 *         type: string
 *       type:
 *         type: string
 *       company:
 *         type: string
 *       documents:
 *         type: string[]
 *       title:
 *         type: string
 *         default: ''
 */
class User {
  /**
   * @param {string} id
   * @param {*} data
   */
  constructor(id, data) {
    this.id = id;
    this.email = data.email;
    this.name = data.name;
    this.type = data.enum;
    this.companyId = data.company;
    this.documents = data.documents;
    this.title = data.title || '';
  }

  /**
   * Checks if a user has permissions to the document
   * @param {Document} document
   */
  hasAccess(document) {
    // For now just check if the document is one of the users
    return this.documents.indexOf(document.id) > -1;
  }

  /**
   *
   * @return {firebase.Promise.<Company>}
   */
  fetchCompany() {
    // Should later cache this result
    return Company.getById(this.companyId);
  }

  /**
   * Query firebase for a User with a given id
   * @param id
   * @returns {firebase.Promise<User>}
   */
  static getById(id) {
    const db = firebase.database();
    const usersDbRef = db.ref('users');
    return usersDbRef.child(id).once('value')
      .then((snapshot) => { // eslint-disable-line arrow-body-style
        return new Promise((fulfill, reject) => {
          const data = snapshot.val();
          if (!data) reject(new NotFoundError(`User:${this.id}`)); // couldn't find user
          fulfill(new User(id, data));
        });
      });
  }
}

module.exports = User;
