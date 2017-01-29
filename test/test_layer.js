var should = require('should');
var assert = require('assert');
var request = require('supertest');
var winston = require('winston');

var layerInserted = 0;

describe('Layer', function() {
  var url = 'http://localhost:3000';
  before(function(done) {
    done();
  });

  describe('API REST test', function()
	{
    it('[POST]    Get all layers', function(done) {
      //this.timeout(500);
      //setTimeout(done, 300);

    request(url)
	  .post('/kyrosapi/layers')

    // end handles the response
	  .end(function(err, res) {
          if (err) {
            throw err;
          }
					res.status.should.be.equal(200);
          done();
        });
    });

	it('[POST]    Add layer', function(done) {
    var body = {
      name: 'name of layer',
      showName: 'showName of layer',
      visible: 'true',
      transparent: 'true'
  	};
	request(url)
	.post('/kyrosapi/layer')
	.send(body)
	// end handles the response
	.end(function(err, res) {
				if (err) {
					throw err;
				}
        //console.log(res);
        layerInserted = res.body.response.data.record[0].id;
				res.status.should.be.equal(201);
				done();
			});
	});

  it('[GET]     Get layer', function(done) {
  request(url)
  .get('/kyrosapi/layer/'+layerInserted)
  // end handles the response
  .end(function(err, res) {
        if (err) {
          throw err;
        }
        res.status.should.be.equal(200);
        done();
      });
  });


  it('[PUT]     Update layer', function(done){
  var body = {
  id: layerInserted,
  name: 'name of layer',
  showName: 'showName of layer',
  visible: 'true',
  transparent: 'true'
  };
  request(url)
  .put('/kyrosapi/layer')
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

  it('[DELETE]  Remove layer', function(done) {
    var body = {
      id: layerInserted
  	};
	request(url)
	.delete('/kyrosapi/layer')
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
