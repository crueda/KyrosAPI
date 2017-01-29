var should = require('should');
var assert = require('assert');
var request = require('supertest');
var winston = require('winston');

var serviceInserted = 0;

describe('User', function() {
  var url = 'http://localhost:3000';
  before(function(done) {
    done();
  });

  describe('API REST test', function()
	{
    it('[POST]    Get all users', function(done) {
    request(url)
	  .post('/kyrosapi/users')

    // end handles the response
	  .end(function(err, res) {
          if (err) {
            throw err;
          }
					res.status.should.be.equal(200);
          done();
        });
    });

    it('[GET]    Get user', function(done) {
    request(url)
    .get('/kyrosapi/user/1')
    // end handles the response
    .end(function(err, res) {
          if (err) {
            throw err;
          }
          res.status.should.be.equal(200);
          done();
        });
    });

  });

});
