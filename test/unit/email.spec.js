/**
 * Created by austin on 8/5/16.
 */

const utils = require('../../lib/utils');
const chai = require('chai');
chai.should();

describe('Basic Email', () => {
  it('should send an email', (done) => {
    const mailPromise = utils.sendMail({
      to: 'austin.cawley@gmail.com',
      subject: 'Unit tests amirite?',
      text: 'They just ok.',
    });
    mailPromise.then((result) => {
      console.log(result);
      done();
    })
    .catch((error) => {
      console.log(error);
      done();
    });
  });
});

