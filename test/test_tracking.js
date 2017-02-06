var should = require('should');
var assert = require('assert');
var request = require('supertest');
var winston = require('winston');

var areaInserted = 0;

describe('Tracking', function() {
  var url = 'http://localhost:3003';
  before(function(done) {
    done();
  });

  describe('API REST test', function()
	{
    it('[POST]    Get tracking1 from 1 fleet', function(done) {
    request(url)
	  .post('/tracking1/fleet/595')
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

    it('[POST]    Get tracking1 from fleets', function(done) {
      var body = {
        'fleets': [15,89,126,345]
      };
    request(url)
    .post('/tracking1/fleets')
      .set('X-Access-Token','eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjIwOTA4MjY4NjU5MzMsImlzcyI6ImNydWVkYSIsInN1YiI6IlFjem1xaXFqc0JvMDIifQ.Vf1O_oIt-_pCqOP0yroA61ydJAMu2cZsMWdBHxu-GMk')
    .send(body)
    // end handles the response
    .end(function(err, res) {
          if (err) {
            throw err;
          }
          res.status.should.be.equal(200);
          done();
        });
    });

    it('[POST]    Get tracking1 from 1 vehicle', function(done) {
    request(url)
	  .post('/tracking1/vehicle/460')
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

    it('[POST]    Get tracking1 from vehicles', function(done) {
      var body = {
        'vehicles': [ 197, 119, 73]
      };
    request(url)
    .post('/tracking1/vehicles')
      .set('X-Access-Token','eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjIwOTA4MjY4NjU5MzMsImlzcyI6ImNydWVkYSIsInN1YiI6IlFjem1xaXFqc0JvMDIifQ.Vf1O_oIt-_pCqOP0yroA61ydJAMu2cZsMWdBHxu-GMk')
    .send(body)
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
