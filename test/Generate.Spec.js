/**
 * Created by austin on 7/21/16.
 */

const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../server');
chai.should();

chai.use(chaiHttp);

describe('Generate NDA', () => {
  const goodData = {
    pi: {
      name: 'Austin Cawley-Edwards',
      title: 'Chief Jokes Officer',
      email: 'austin.cawley@gmail.com',
    },
    company: {
      type: 'LLC',
      name: 'Ten Characters',
      state: 'Company State',
      location: '221 River Street, Hoboken, New Jersey',
      contact: {
        name: 'Austin',
        email: 'austin@austin.me',
      },
    },
    project: {
      industry: 'Contracts Contracts Contracts',
      description: 'A boring contract generator. Is this still boring?',
    },
    type: 'mutual',
  };

  it('should throw an error if no type is supplied', (done) => {
    chai.request(server)
      .post('/generate')
      .send()
      .end((err, res) => {
        res.should.have.status(400);
        done();
      });
  });
  it('should return a filled in document when given good data', (done) => {
    chai.request(server)
      .post('/generate')
      .send(goodData)
      .end((err, res) => {
        res.should.be.ok;
        // PI
        res.body.nda.should.contain(goodData.pi.name);
        res.body.nda.should.contain(goodData.pi.title);
        // Company
        res.body.nda.should.contain(goodData.company.type);
        res.body.nda.should.contain(goodData.company.name);
        res.body.nda.should.contain(goodData.company.state);
        res.body.nda.should.contain(goodData.company.location);
        // Project
        res.body.nda.should.contain(goodData.project.industry);
        res.body.nda.should.contain(goodData.project.description);
        // Type
        res.body.nda.should.contain(goodData.type);
        done();
      });
  });
});
