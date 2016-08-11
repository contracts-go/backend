/**
 * Created by austin on 8/10/16.
 */

class ResponseError extends Error {
  constructor(data) {
    super(data.message, data.options);
    this.status = data.code;
  }
}

module.exports = ResponseError;
