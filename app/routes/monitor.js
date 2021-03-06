var express = require('express');
var router = express.Router();

var status = require("../utils/statusCodes.js");
var messages = require("../utils/statusMessages.js");

// Fichero de propiedades
var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('kyrosapi.properties');

var MonitorModel = require('../models/monitor');

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

/*
 * @api {get} /monitor  Monitor tree
 * @apiName GetMonitor 
 * @apiGroup Monitor
 * @apiDescription Monitor tree from user
 * @apiVersion 1.0.1
 * @apiSampleRequest https://api.kyroslbs.com/monitor/crueda
 *
 * @apiParam {String} username Username in Kyros
 *
 * @apiSuccess {json} monitorData Monitor data
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *
 *     }
 */
router.get('/monitor/:username', function(req, res)
{
    if (req.session.user == null){
      res.redirect('/');
    }
    else {
      var username = req.params.username;
      log.info("GET: /monitor/"+username);

      MonitorModel.getMonitorFromUser(username,function(error, data)
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
            res.status(200).json(data);
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

router.get('/monitor/checked/:username', function(req, res)
{
    if (req.session.user == null){
      res.redirect('/');
    }
    else {
      var username = req.params.username;
      var vehicleLicenseList = req.query.vehicleLicenseList;
      log.info("GET: /monitor/checked/"+username+"?vehicleLicenseList="+vehicleLicenseList);

      if (vehicleLicenseList==null) {
        vehicleLicenseList = "";
      }
      var requestData = {
          username : username,
          vehicleLicenseList : vehicleLicenseList
      };

      MonitorModel.setMonitorCheckedFromUser(requestData,function(error, data)
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
module.exports = router;
