/**
 * Created by austin on 7/21/16.
 */

const chai = require('chai');
const request = require('supertest');
const server = require('../server');

chai.should();

describe('Generate NDA', () => {
  const url = 'http://google.com';
  it('should throw an error if no type is supplied', () => {
    request(url).get('/')
      .send()
      .end((err, res) => {
        res.should.have.status(200);
      });
  });
});
