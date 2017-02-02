var should = require('should');
var assert = require('assert');
var request = require('supertest');
var winston = require('winston');

var areaInserted = 0;

describe('Area', function() {
  var url = 'http://localhost:3000';
  before(function(done) {
    done();
  });

  describe('API REST test', function()
	{
    it('[POST]    Get all areas', function(done) {
    request(url)
	  .post('/tracking1/fleet/Roberto')
    .set('X-Access-Token','eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjIwOTA4MjY4NjU5MzMsImlzcyI6ImNydWVkYSIsInN1YiI6IlFjem1xaXFqc0JvMDIifQ.Vf1O_oIt-_pCqOP0yroA61ydJAMu2cZsMWdBHxu-GMk')


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