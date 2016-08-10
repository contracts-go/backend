/**
 * @file Created by austin on 7/26/16.
 */

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
   * @param {{}} data
   */
  constructor(data) {
    this.email = data.email;
    this.name = data.name;
    this.type = data.enum;
    this.company = data.company;
    this.documents = data.documents;
    this.title = data.title || '';
  }
}

module.exports = User;
