var should = require('should');
var assert = require('assert');
var request = require('supertest');
var winston = require('winston');

var POIInserted = 0;

describe('POI', function() {
  var url = 'http://localhost:3000';
  before(function(done) {
    done();
  });

  describe('API REST test', function()
	{
    it('[POST]    Get all POIs', function(done) {
      //this.timeout(500);
      //setTimeout(done, 300);

    request(url)
	  .post('/kyrosapi/POIs')

    // end handles the response
	  .end(function(err, res) {
          if (err) {
            throw err;
          }
					res.status.should.be.equal(200);
          done();
        });
    });

	it('[POST]    Add POI', function(done) {
    var body = {
      description: 'POI description',
      latitude: 40.3,
      longitude: -2.1,
      name: 'test',
      description: 'test',
      categoryId: '0'
  	};
	request(url)
	.post('/kyrosapi/POI')
	.send(body)
	// end handles the response
	.end(function(err, res) {
				if (err) {
					throw err;
				}
        //console.log(res);
        POIInserted = res.body.response.data.record[0].id;
				res.status.should.be.equal(201);
				done();
			});
	});

  it('[GET]    Get POI', function(done) {
  request(url)
  .get('/kyrosapi/POI/'+POIInserted)
  // end handles the response
  .end(function(err, res) {
        if (err) {
          throw err;
        }
        res.status.should.be.equal(200);
        done();
      });
  });


  it('[PUT]     Update POI', function(done){
  var body = {
  id: POIInserted,
  latitude: '41.3',
  longitude: '-3.1',
  name: 'test',
  description: 'test',
  categoryId: '0'
  };
  request(url)
  .put('/kyrosapi/POI')
  .send(body)
  .expect('Content-Type', /json/)
  .expect(200) //Status code
  .end(function(err,res) {
    if (err) {
      throw err;
    }
    // Should.js fluent syntax applied
    done();
  });
  });

  it('[DELETE]  Remove POI', function(done) {
    var body = {
      id: POIInserted
  	};
	request(url)
	.delete('/kyrosapi/POI')
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
