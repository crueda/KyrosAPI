var express = require('express');
var router = express.Router();

var status = require("../utils/statusCodes.js");
var messages = require("../utils/statusMessages.js");

// Fichero de propiedades
var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('./kyrosview.properties');

var UserModel = require('../models/user');

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

router.get('/app/user/:username', function(req, res)
{
  var username = req.params.username;
  var push_mode = req.query.push_mode;
  var group_mode = req.query.group_mode;
  var max_show_notifications = req.query.max_show_notifications;

  log.info("GET: /app/user/"+username+"?push_mode="+push_mode+"&group_mode="+group_mode+"&max_show_notifications="+max_show_notifications);
  UserModel.setUserPreferences(username, push_mode, group_mode, max_show_notifications, function(error, data) {
    if (data == null) {
      res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
    }
    else {
      //si existe enviamos el json
      if (typeof data !== 'undefined') {
        res.status(200).json(data)
      } else {
        res.status(202).json({"response": {"status":status.STATUS_NOT_FOUND_REGISTER,"description":messages.MISSING_REGISTER}})
      }
    }
  });
});

router.get('/app/setDeviceInfo/user/:username', function(req, res)
{
  var username = req.params.username;
  var token = req.query.token;
  var device_model = req.query.device_model;
  var device_platform = req.query.device_platform;
  var device_version = req.query.device_version;
  var device_manufacturer = req.query.device_manufacturer;
  var device_serial = req.query.device_serial;
  var device_uuid = req.query.device_uuid;
  var device_height = req.query.device_height;
  var device_width = req.query.device_width;
  var device_language = req.query.device_language;

  log.info("GET: /app/user/setDeviceInfo?username="+username+"&token="+token+
  "&device_model="+device_model+"&device_platform="+device_platform+"&device_version="+device_version
  +"&device_manufacturer="+device_manufacturer+"&device_serial="+device_serial+"&device_uuid="+device_uuid
  +"&device_height="+device_height+"&device_width="+device_width+"&device_language="+device_language);
  if (username==undefined || token==undefined) {
    res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
  }
  else {
    UserModel.saveDeviceInfo(username, token, device_model,
      device_platform, device_version, device_manufacturer, device_serial, device_uuid,
      device_height, device_width, device_language, function(error, data) {
      if (data == null) {
        res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
      }
      else {
        //si existe enviamos el json
        if (typeof data !== 'undefined') {
          res.status(200).json(data)
        } else {
          res.status(202).json({"response": {"status":status.STATUS_NOT_FOUND_REGISTER,"description":messages.MISSING_REGISTER}})
        }
      }
    });
  }
});

module.exports = router;
