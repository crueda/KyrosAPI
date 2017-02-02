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

/**
 * @api {get} /status Request Kyros API service status
 * @apiName GetStatus
 * @apiGroup Status
 * @apiVersion 1.0.1
 *
 * @apiDescription Kyros API service status
 * @apiSampleRequest https://api.kyroslbs.com/status
 *
 * @apiSuccess {String} status Status of service (ON/OFF)
 * @apiSuccess {String} upTime Uptime of service (in seconds)
 * @apiSuccessExample Success-Response:
 *     https/1.1 200 OK
 *     {
 *       "status": "ON",
 *       "upTime": "123.21",
 *     }
 */
router.get("/status", function(req,res)
{
  log.info("GET: /Status");

  var time = process.uptime();
  res.status(200).json({"status":"ON", "upTime":time})

});

/**
 * @api {post} /status Request Kyros API service status
 * @apiName PostStatus
 * @apiGroup Status
 * @apiVersion 1.0.1
 *
 * @apiDescription Kyros API service status
 * @apiSampleRequest https://api.kyroslbs.com/status
 *
 * @apiSuccess {String} status Status of service (ON/OFF)
 * @apiSuccess {String} upTime Uptime of service (in seconds)
 * @apiSuccessExample Success-Response:
 *     https/1.1 200 OK
 *     {
 *       "status": "ON",
 *       "upTime": "123.21",
 *     }
 */
router.post("/status", function(req,res)
{
  log.info("POST: /Status");

  var time = process.uptime();
  res.status(200).json({"status":"ON", "upTime":time})

});

module.exports = router;
