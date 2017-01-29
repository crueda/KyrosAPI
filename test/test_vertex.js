var should = require('should');
var assert = require('assert');
var request = require('supertest');
var winston = require('winston');

var vertexInserted = 0;

describe('Vertex', function() {
  var url = 'http://localhost:3000';
  before(function(done) {
    done();
  });

  describe('API REST test', function()
	{
    it('[POST]    Get all vertexes assigned to area 892', function(done) {
    request(url)
	  .post('/kyrosapi/vertexes/assignedTo/892')

    // end handles the response
	  .end(function(err, res) {
          if (err) {
            throw err;
          }
					res.status.should.be.equal(200);
          done();
        });
    });

    it('[POST]    Get all vertexes', function(done) {
    request(url)
	  .post('/kyrosapi/vertexes')

    // end handles the response
	  .end(function(err, res) {
          if (err) {
            throw err;
          }
					res.status.should.be.equal(200);
          done();
        });
    });

	it('[POST]    Add vertex', function(done) {
    var body = {
      areaId: '892',
      description: 'Vértice: 1',
      numVertex: '1',
      latitude: '43.31418735795812',
      longitude: '-2.319488525390625'
  	};
	request(url)
	.post('/kyrosapi/vertex')
	.send(body)
	// end handles the response
	.end(function(err, res) {
				if (err) {
					throw err;
				}
        //console.log(res);
        //console.log("-->" + res.body.message);
				res.status.should.be.equal(201);
        vertexInserted = res.body.response.data.record[0].id;
				done();
			});
	});

  it('[GET]    Get vertex', function(done) {
  request(url)
  .get('/kyrosapi/vertex/'+vertexInserted)
  // end handles the response
  .end(function(err, res) {
        if (err) {
          throw err;
        }
        res.status.should.be.equal(200);
        done();
      });
  });


  it('[PUT]     Update vertex', function(done){
  var body = {
    id: vertexInserted,
    areaId: '892',
    description: 'Vértice: 1',
    numVertex: '1',
    latitude: '43.31418735795812',
    longitude: '-2.319488525390625'
  };
  request(url)
  .put('/kyrosapi/vertex')
  .send(body)
  .expect('Content-Type', /json/)
  .expect(200) //Status code
  .end(function(err,res) {
    if (err) {
      throw err;
    }
    // Should.js fluent syntax applied
    /*
    res.body.should.have.property('_id');
      res.body.firstName.should.equal('JP');
                res.body.lastName.should.equal('Berd');
                res.body.creationDate.should.not.equal(null);
    */
    done();
  });
  });

  it('[DELETE]  Remove vertex', function(done) {
    var body = {
      id: vertexInserted
  	};
	request(url)
	.delete('/kyrosapi/vertex')
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
