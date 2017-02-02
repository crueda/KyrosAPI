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
	  .post('/areas')
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
/*
	it('[POST]    Add area', function(done) {
    var body = {
      description: 'DELETE_area description',
      typeArea: 'G',
      initDate: '2017-01-01T00:00:00.00Z',
      endDate: '2011-01-02T00:00:00.00Z',
      initHour: '0000',
      endHour: '2359',
      radius: 0
  	};
	request(url)
	.post('/area')
  .set('X-Access-Token','eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE1MjY5ODI1MDA1ODksImlzcyI6InN1bW8iLCJyb2xlIjoiYWRtaW5pc3RyYXRvciJ9.CnX6I1puC-H-0AluXge8X4vVlUOfv8x-Nh6VwzxO-n8')
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
    .get('/area/'+areaInserted)
    .set('X-Access-Token','eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE1MjY5ODI1MDA1ODksImlzcyI6InN1bW8iLCJyb2xlIjoiYWRtaW5pc3RyYXRvciJ9.CnX6I1puC-H-0AluXge8X4vVlUOfv8x-Nh6VwzxO-n8')
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
      initDate: '2015-04-01T00:00:00.00Z',
      endDate: '2015-04-01T00:00:00.00Z',
      initHour: '0000',
      endHour: '2359',
      radius: 0
  };
  request(url)
  .put('/area')
  .set('X-Access-Token','eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE1MjY5ODI1MDA1ODksImlzcyI6InN1bW8iLCJyb2xlIjoiYWRtaW5pc3RyYXRvciJ9.CnX6I1puC-H-0AluXge8X4vVlUOfv8x-Nh6VwzxO-n8')
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
      id: parseInt(areaInserted)
  	};
	request(url)
	.delete('/area')
  .set('X-Access-Token','eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE1MjY5ODI1MDA1ODksImlzcyI6InN1bW8iLCJyb2xlIjoiYWRtaW5pc3RyYXRvciJ9.CnX6I1puC-H-0AluXge8X4vVlUOfv8x-Nh6VwzxO-n8')
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
*/
  });

});
