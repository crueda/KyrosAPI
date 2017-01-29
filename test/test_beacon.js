var should = require('should');
var assert = require('assert');
var request = require('supertest');
var winston = require('winston');

var beaconInserted = 0;

describe('Beacon', function() {
  var url = 'http://localhost:3000';
  before(function(done) {
    done();
  });

  describe('API REST test', function()
	{


    it('[POST]    Get all beacons', function(done) {
    request(url)
	  .post('/kyrosapi/beacons')

    // end handles the response
	  .end(function(err, res) {
          if (err) {
            throw err;
          }
					res.status.should.be.equal(200);
          done();
        });
    });

	it('[POST]    Add beacon', function(done) {
    var body = {
      routeId: '892',
      posBeacon: '1',
      description: 'Baliza: 1',
      radius: '10',
      latitude: '43.31418735795812',
      longitude: '-2.319488525390625'
  	};
	request(url)
	.post('/kyrosapi/beacon')
	.send(body)
	// end handles the response
	.end(function(err, res) {
				if (err) {
					throw err;
				}
				res.status.should.be.equal(201);
        beaconInserted = res.body.response.data.record[0].id;
				done();
			});
	});

  it('[GET]    Get beacon', function(done) {
  request(url)
  .get('/kyrosapi/beacon/'+beaconInserted)
  // end handles the response
  .end(function(err, res) {
        if (err) {
          throw err;
        }
        res.status.should.be.equal(200);
        done();
      });
  });


  it('[PUT]     Update beacon', function(done){
  var body = {
  id: beaconInserted,
  routeId: '8922',
  posBeacon: '12',
  description: 'Beacon: 12',
  radius: '102',
  latitude: '43.314187357958122',
  longitude: '-2.3194885253906252'
  };
  request(url)
  .put('/kyrosapi/beacon')
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


  it('[DELETE]  Remove beacon', function(done) {
    var body = {
      id: beaconInserted
  	};
	request(url)
	.delete('/kyrosapi/beacon')
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
