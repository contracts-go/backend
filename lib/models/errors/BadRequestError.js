/**
 * Created by austin on 8/11/16.
 */

const ResponseError = require('./ResponseError');

class BadRequestError extends ResponseError {
  /**
   * The client made a Bad Request
   * @param data
   */
  constructor(data) {
    super(data);
    this.status = 400;
  }
}

module.exports = BadRequestError;
