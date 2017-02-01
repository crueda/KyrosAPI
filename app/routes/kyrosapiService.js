var status = require("../utils/statusCodes.js");
var messages = require("../utils/statusMessages.js");
var express = require('express');
var router = express.Router();

// Fichero de propiedades
var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('kyrosapi.properties');

// Definición del log
var fs = require('fs');
var log = require('tracer').console({
    transport : function(data) {
        //console.log(data.output);
        fs.open(properties.get('main.log.file'), 'a', 0666, function(e, id) {
            fs.write(id, data.output+"\n", null, 'utf8', function() {
                fs.close(id, function() {
                });
            });
        });
    }
});

router.post("/Status", function(req,res)
{
  log.info("POST: /Status");

  var time = process.uptime();
  res.status(200).json({"status":"ON", "upTime":time})

});

/* GET. Service status */
/**
 * @api {get} /kyrosapi/Status Request Kyros API service status
 * @apiName GetStatus
 * @apiGroup Status
 * @apiVersion 1.0.1
 *
 * @apiDescription Kyros API service status
 * @apiSampleRequest https://sumo.kyroslbs.com/kyrosapi/Status
 * @apiHeader {String} x-access-token JSON Web Token (JWT)
 * @apiHeaderExample {json} Header-Example:
 *     {
 *       "x-access-token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE0MzIyMTg2ODc1ODksImlzcyI6InN1bW8iLCJyb2xlIjoiYWRtaW5pc3RyYXRvciJ9._tYZLkBrESt9FwOccyvripIsZR5S0m8PLZmEgIDEFaY"
 *     }
 *
 * @apiSuccess {String} status Status of service (ON/OFF)
 * @apiSuccess {String} upTime Uptime of service (in seconds)
 * @apiSuccessExample Success-Response:
 *     https/1.1 200 OK
 *     {
 *       "status": "ON",
 *       "upTime": "123.21",
 *     }
 * @apiErrorExample {json} Error-Response:
 *     https/1.1 401 Not authorized
 *     {
 *       "message": "Invalid user"
 *     }
 * @apiErrorExample {json} Error-Response:
 *     https/1.1 401 Not authorized
 *     {
 *       "message": "Invalid token"
 *     }
 * @apiErrorExample {json} Error-Response:
 *     https/1.1 401 Not authorized
 *     {
 *       "message": "Token expired"
 *     }
 */
router.get("/Status", function(req,res)
{
  log.info("GET: /Status");

  var time = process.uptime();
  res.status(200).json({"status":"ON", "upTime":time})

});

module.exports = router;
