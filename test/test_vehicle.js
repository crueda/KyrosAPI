var should = require('should');
var assert = require('assert');
var request = require('supertest');
var winston = require('winston');

var vehicleInserted = 0;

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

function randomInt (low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}

describe('Vessel', function() {
  var url = 'http://localhost:3000';
  before(function(done) {
    done();
  });

  describe('API REST test', function()
	{
    it('[POST]    Get all vehicles', function(done) {
    request(url)
	  .post('/kyrosapi/vehicles')

    // end handles the response
	  .end(function(err, res) {
          if (err) {
            throw err;
          }
					res.status.should.be.equal(200);
          done();
        });
    });

	it('[POST]    Add vehicle', function(done) {
    var body = {
      license: guid(),
      alias: 'alias_coche',
      imei: randomInt(1,35000),
      fleetId: '1'
  	};
	request(url)
	.post('/kyrosapi/vehicle')
	.send(body)
	// end handles the response
	.end(function(err, res) {
				if (err) {
					throw err;
				}
				res.status.should.be.equal(201);
        vehicleInserted = res.body.response.data.record[0].id;
				done();
			});
	});


  it('[GET]    Get vessel', function(done) {
  request(url)
  .get('/kyrosapi/vehicle/'+vehicleInserted)
  // end handles the response
  .end(function(err, res) {
        if (err) {
          throw err;
        }
        res.status.should.be.equal(200);
        done();
      });
  });


  it('[PUT]     Update vehicle', function(done){
    var body = {
      id: vehicleInserted,
      alias: 'alias_coche2',
      fleetId: '2'
  };
  request(url)
  .put('/kyrosapi/vehicle')
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


  it('[DELETE]  Remove vehicle', function(done) {
    var body = {
      id: vehicleInserted
  	};
	request(url)
	.delete('/kyrosapi/vehicle')
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
