/**
 * Created by austin on 8/5/16.
 */

require('../fake-firebase');
const server = require('../../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.should();

chai.use(chaiHttp);

describe('Basic Firebase Connections', () => {
  it('should connect to the fake firebase server', () => {
    chai.request(server)
      .get('/')
      .send()
      .end((err, res) => {
        res.should.be.ok; // eslint-disable-line
      });
  });
});
