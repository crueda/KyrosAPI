var status = require("../utils/statusCodes.js");
var messages = require("../utils/statusMessages.js");
var express = require('express');
var router = express.Router();
var ApiModel = require('../models/api');

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
 * @api {get|post} /status Request Kyros API service status
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
  log.info("GET: /status");

  var time = process.uptime();
  res.status(200).json({"status":"ON", "upTime":time})

});

router.post("/status", function(req,res)
{
  log.info("POST: /status");

  var time = process.uptime();
  res.status(200).json({"status":"ON", "upTime":time})

});

router.get("/stats", function(req,res)
{
  //log.info("GET: /stats");
      /*var keys = Object.keys( global.tickle.route );
      for( var i = 0,length = keys.length; i < length; i++ ) {
      }*/

   res.status(200).json(
        {
          "counter":global.tickle.all,
          "requests":global.tickle.route,
          "request_time":global.tickle.tpr()
        }
        );
});

router.post("/stats", function(req,res)
{
  //log.info("POST: /stats");
   res.status(200).json(
        {
          "counter":global.tickle.all,
          "requests":global.tickle.route,
          "request_time":global.tickle.tpr()
        }
    );
});

module.exports = router;
