var express = require('express');
var router = express.Router();

var status = require("../utils/statusCodes.js");
var messages = require("../utils/statusMessages.js");

// Fichero de propiedades
var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('kyrosapi.properties');

var ReportModel = require('../models/report');

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


router.get('/app/report_daily/device/:deviceId', function(req, res)
{
    var deviceId = req.params.deviceId;
    log.info("GET: /app/report_daily/device/"+deviceId);

    if (deviceId==null) {
      res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
    }
    else {
      ReportModel.getReportDailyData(deviceId,function(error, data)
      {
        if (data == null)
        {
          res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
        }
        else
        {
          //si existe enviamos el json
          if (data !== 'undefined')
          {
            res.status(200).json(data)
          }
          else
          {
            res.status(202).json({"response": {"status":status.STATUS_NOT_FOUND_REGISTER,"description":messages.MISSING_REGISTER}})
          }
        }
      });
    }
});

module.exports = router;
