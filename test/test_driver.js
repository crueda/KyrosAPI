var should = require('should');
var assert = require('assert');
var request = require('supertest');
var winston = require('winston');

var personnelInserted = 0;

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

describe('Personnel', function() {
  var url = 'http://localhost:3000';
  before(function(done) {
    done();
  });

  describe('API REST test', function()
	{

    it('[POST]    Get all personnels', function(done) {
    request(url)
	  .post('/kyrosapi/personnels')

    // end handles the response
	  .end(function(err, res) {
          if (err) {
            throw err;
          }
					res.status.should.be.equal(200);
          done();
        });
    });


	it('[POST]    Add personnel', function(done) {
    var body = {
      license: guid(),
      firstName: 'Luis',
      lastName: 'Perez',
      company: 'Vikinger',
      role: 'admin',
      access: '1',
      workingTime: '2',
      certificateList: '1,2',
      certificateExpirationList: '1434520866000,1434520866001',
      email: 'luis@vikinger.com',
      phone: '555333222',
      nok: 'Angel'
  	};
	request(url)
	.post('/kyrosapi/personnel')
	.send(body)
	// end handles the response
	.end(function(err, res) {
				if (err) {
					throw err;
				}
				res.status.should.be.equal(201);
        personnelInserted = res.body.response.data.record[0].id;
        done();
			});
	});


  it('[GET]    Get personnel', function(done) {
  request(url)
  .get('/kyrosapi/personnel/'+personnelInserted)
  // end handles the response
  .end(function(err, res) {
        if (err) {
          throw err;
        }
        res.status.should.be.equal(200);
        done();
      });
  });


  it('[PUT]     Update personnel', function(done){
    var body = {
      id: personnelInserted,
      firstName: 'Luis',
      lastName: 'Perez',
      company: 'Vikinger',
      role: 'admin',
      access: '1',
      workingTime: '2',
      certificateList: '1,2',
      certificateExpirationList: '1434520866000,1434520866001',
      email: 'luis@vikinger.com',
      phone: '555333223',
      nok: 'Angel'
  };
  request(url)
  .put('/kyrosapi/personnel')
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


  it('[DELETE]  Remove personnel', function(done) {
    var body = {
      id: personnelInserted
  	};
	request(url)
	.delete('/kyrosapi/personnel')
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
