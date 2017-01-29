var should = require('should');
var assert = require('assert');
var request = require('supertest');
var winston = require('winston');

var trackingInserted = 0;

describe('Tracking', function() {
  var url = 'http://localhost:3000';
  before(function(done) {
    done();
  });

  describe('API REST test', function()
	{
    it('[POST]    Get all trackings', function(done) {
      var body = {
        startRow: '1',
        endRow: '50'
    	};
    request(url)
	  .post('/kyrosapi/trackings')
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

	it('[POST]    Add tracking', function(done) {
    var body = {
      deviceId: '12232',
      altitude: '12',
      speed: '12',
      heading: '12',
      latitude: '43.31418735795812',
      longitude: '-2.319488525390625'
  	};
	request(url)
	.post('/kyrosapi/tracking')
	.send(body)
	// end handles the response
	.end(function(err, res) {
				if (err) {
					throw err;
				}
				res.status.should.be.equal(201);
        trackingInserted = res.body.response.data.record[0].id;
				done();
			});
	});

  it('[GET]    Get tracking', function(done) {
  request(url)
  .get('/kyrosapi/tracking/'+trackingInserted)
  // end handles the response
  .end(function(err, res) {
        if (err) {
          throw err;
        }
        res.status.should.be.equal(200);
        done();
      });
  });


  it('[PUT]     Update tracking', function(done){
  var body = {
    id: parseInt(trackingInserted),
    altitude: '12',
    speed: '12',
    heading: '12',
    latitude: '43.31418735795812',
    longitude: '-2.319488525390625'
  };
  request(url)
  .put('/kyrosapi/tracking')
  .send(body)
  .expect('Content-Type', /json/)
  .expect(200) //Status code
  .end(function(err,res) {
    if (err) {
      throw err;
    }
    done();
  });
  });

  it('[DELETE]  Remove tracking', function(done) {
    var body = {
      id: parseInt(trackingInserted)
  	};
	request(url)
	.delete('/kyrosapi/tracking')
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
