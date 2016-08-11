/**
 * Created by austin on 8/10/16.
 */

const ResponseError = require('./ResponseError');

class UnauthorizedError extends ResponseError {
  constructor(data) {
    super(data);
    this.status = 401;
    this.message = `${data.user} is unauthorized to ${data.action}`;
  }
}

module.exports = UnauthorizedError;
