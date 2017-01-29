var should = require('should');
var assert = require('assert');
var request = require('supertest');
var winston = require('winston');

var routeInserted = 0;

describe('Route', function() {
  var url = 'http://localhost:3000';
  before(function(done) {
    done();
  });

  describe('API REST test', function()
	{
    it('[POST]    Get all routes', function(done) {
    request(url)
	  .post('/kyrosapi/routes')

    // end handles the response
	  .end(function(err, res) {
          if (err) {
            throw err;
          }
					res.status.should.be.equal(200);
          done();
        });
    });

	it('[POST]    Add route', function(done) {
    var body = {
      description: 'route description',
      routeType: 'G',
      initDate: '2011-11-04T00:00:00Z',
      endDate: '2011-11-04T00:00:00Z'
  	};
	request(url)
	.post('/kyrosapi/route')
	.send(body)
	// end handles the response
	.end(function(err, res) {
				if (err) {
					throw err;
				}
				res.status.should.be.equal(201);
        routeInserted = res.body.response.data.record[0].id;
				done();
			});
	});

  it('[GET]    Get route', function(done) {
  request(url)
  .get('/kyrosapi/route/'+routeInserted)
  // end handles the response
  .end(function(err, res) {
        if (err) {
          throw err;
        }
        res.status.should.be.equal(200);
        done();
      });
  });


  it('[PUT]     Update route', function(done){
    var body = {
      id: routeInserted,
      description: 'route description2',
      routeType: 'G',
      initDate: '2011-11-04T00:00:00Z',
      endDate: '2011-11-04T00:00:00Z'
  };
  request(url)
  .put('/kyrosapi/route')
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


  it('[DELETE]  Remove route', function(done) {
    var body = {
      id: routeInserted
  	};
	request(url)
	.delete('/kyrosapi/route')
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
