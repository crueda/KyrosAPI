var express = require('express');
var router = express.Router();

var status = require("../utils/statusCodes.js");
var messages = require("../utils/statusMessages.js");

// Fichero de propiedades
var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('kyrosapi.properties');

var GraphModel = require('../models/graph');

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

router.get('/app/graph/vehicle/:vehicleLicense', function(req, res)
{
    var vehicleLicense = req.params.vehicleLicense;
    log.info("GET: /app/graph/vehicle/"+vehicleLicense);

    if (vehicleLicense==null) {
      res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
    }
    else {
      GraphModel.getGraphData(vehicleLicense,function(error, data)
      {
        if (data == null)
        {
          res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
        }
        else
        {
          //si existe enviamos el json
          if (typeof data !== 'undefined' && data.length > 0)
          {
            res.status(200).json(data)
          }
          else if (typeof data == 'undefined' || data.length == 0)
          {
            res.status(200).json([])
          }
          //en otro caso mostramos un error
          else
          {
            res.status(202).json({"response": {"status":status.STATUS_NOT_FOUND_REGISTER,"description":messages.MISSING_REGISTER}})
          }
        }
      });
    }
});

router.get('/app/graph/reset/vehicle/:vehicleLicense', function(req, res)
{
    var vehicleLicense = req.params.vehicleLicense;
    log.info("GET: /app/graph/reset/vehicle/"+vehicleLicense);

    if (vehicleLicense==null) {
      res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
    }
    else {
      GraphModel.resetGraphData(vehicleLicense,function(error, data)
      {
        if (data == null)
        {
          res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
        }
        else
        {
          //si existe enviamos el json
          if (typeof data !== 'undefined')
          {
            res.status(200).json(data)
          }
          //en otro caso mostramos un error
          else
          {
            res.status(202).json({"response": {"status":status.STATUS_NOT_FOUND_REGISTER,"description":messages.MISSING_REGISTER}})
          }
        }
      });
    }
});

module.exports = router;
