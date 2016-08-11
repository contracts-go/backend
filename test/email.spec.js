/**
 * Created by austin on 8/5/16.
 */

const firebaseServer = require('./fake-firebase');
const server = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.should();

chai.use(chaiHttp);

describe('Basic Email', () => {
  it('should email using test data', () => {
    chai.request(server)
      .post('/email')
      .send({
        document: 'documentOne',
        sender: 'userOne',
        recipient: 'userThree',
      })
      .end((err, res) => {
        res.should.be.ok; // eslint-disable-line
      });
  });
});

