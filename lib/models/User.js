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
 *     properties:
 *       name:
 *         type: string
 *       email:
 *         type: string
 */
class User {
  constructor(name, email) {
    this.name = name;
    this.email = email;
  }
}

module.exports = User;
