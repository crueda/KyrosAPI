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
	  .post('/kyrosapi/areas')

    // end handles the response
	  .end(function(err, res) {
          if (err) {
            throw err;
          }
					res.status.should.be.equal(200);
          done();
        });
    });

	it('[POST]    Add area', function(done) {
    var body = {
      description: 'area description',
      typeArea: 'G',
      initDate: '2015-04-01',
      endDate: '2015-04-01',
      initHour: '03:45:00',
      endHour: '04:56:00',
      radius: '0'
  	};
	request(url)
	.post('/kyrosapi/area')
	.send(body)
	// end handles the response
	.end(function(err, res) {
				if (err) {
					throw err;
				}
				res.status.should.be.equal(201);
        areaInserted = res.body.response.data.record[0].id;
				done();
			});
	});

  it('[GET]    Get area', function(done) {
    request(url)
    .get('/kyrosapi/area/'+areaInserted)
    // end handles the response
    .end(function(err, res) {
          if (err) {
            throw err;
          }
          res.status.should.be.equal(200);
          done();
        });
    });

  it('[PUT]     Update area', function(done){
    var body = {
      id: areaInserted,
      description: 'area description2',
      typeArea: 'G',
      initDate: '2015-04-01',
      endDate: '2015-04-01',
      initHour: '03:45:00',
      endHour: '04:56:00',
      radius: '0'
  };
  request(url)
  .put('/kyrosapi/area')
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


  it('[DELETE]  Remove area', function(done) {
    var body = {
      id: areaInserted
  	};
	request(url)
	.delete('/kyrosapi/area')
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
