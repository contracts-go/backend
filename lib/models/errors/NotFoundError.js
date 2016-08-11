/**
 * Created by austin on 8/10/16.
 */

const ResponseError = require('./ResponseError');

class NotFoundError extends ResponseError {
  /**
   * Not found in the database
   * @param { {resource: string} } data
   */
  constructor(data) {
    super(data);
    this.status = 404;
    this.message = `Cannot find ${data.resource} in the database`;
  }
}

module.exports = NotFoundError;
