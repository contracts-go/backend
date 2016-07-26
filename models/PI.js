/**
 * Created by austin on 7/20/16.
 */

const User = require('./User');

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
