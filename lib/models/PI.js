/**
 * @file Created by austin on 7/20/16.
 */

const User = require('./User');

/**
 * @swagger
 * definition:
 *   PI:
 *     allOf:
 *      - $ref: '#/definitions/User'
 *      - type: object
 *        required:
 *        - email
 *        properties:
 *          email:
 *            type: string
 */
class PI extends User {
    /**
     *
     * @param name
     * @param title
     * @param email
     */
  constructor(name, title, email) {
    super(name, email);
    this.title = title;
  }
}

module.exports = PI;
