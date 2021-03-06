var express = require('express');
var router = express.Router();

var status = require("../utils/statusCodes.js");
var messages = require("../utils/statusMessages.js");

// Fichero de propiedades
var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('kyrosapi.properties');

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
var access_log = require('tracer').console({
  format: "              {{message}}",
  transport: function (data) {
    fs.open(properties.get('main.access_log.file'), 'a', 0666, function (e, id) {
      fs.write(id, data.output + "\n", null, 'utf8', function () {
        fs.close(id, function () {
        });
      });
    });
  }
});

//deprecated
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
      if (data !== 'undefined') {
        res.status(200).json(data)
      } else {
        res.status(202).json({"response": {"status":status.STATUS_NOT_FOUND_REGISTER,"description":messages.MISSING_REGISTER}})
      }
    }
  });
});

router.post('/app/user/:username', function(req, res)
{
  var username = req.params.username;
  var push_mode = req.body.push_mode;
  var group_mode = req.body.group_mode;
  var max_show_notifications = req.body.max_show_notifications;

  log.info("POST: /app/user/"+username);
  access_log.info("BODY >>> " + req.body);

  UserModel.setUserPreferences(username, push_mode, group_mode, max_show_notifications, function(error, data) {
    if (data == null) {
      res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
    }
    else {
      //si existe enviamos el json
      if (data !== 'undefined') {
        res.status(200).json(data)
      } else {
        res.status(202).json({"response": {"status":status.STATUS_NOT_FOUND_REGISTER,"description":messages.MISSING_REGISTER}})
      }
    }
  });
});


router.get('/app/config/user/:username', function(req, res)
{
  var username = req.params.username;

  log.info("GET: /app/config/user/"+username);
  if (username==undefined) {
    res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
  }
  else {
    UserModel.getConfigUser(username, function(error, data) {
      if (data == null) {
        res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
      }
      else {
        //si existe enviamos el json
        if (data !== 'undefined') {
          res.status(200).json(data)
        } else {
          res.status(202).json({"response": {"status":status.STATUS_NOT_FOUND_REGISTER,"description":messages.MISSING_REGISTER}})
        }
      }
    });
  }
});

router.post('/app/setDeviceInfo/user/:username', function(req, res)
{
  var username = req.params.username;
  var token = req.body.token;
  var device_model = req.body.device_model;
  var device_platform = req.body.device_platform;
  var device_version = req.body.device_version;
  var device_manufacturer = req.body.device_manufacturer;
  var device_serial = req.body.device_serial;
  var device_uuid = req.body.device_uuid;
  var device_height = req.body.device_height;
  var device_width = req.body.device_width;
  var device_language = req.body.device_language;
  var app_version = req.body.app_version;
  var app_type = req.body.app_type;

  if (app_type==undefined)
    app_type = 'mypush'

  log.info("POST: /app/setDeviceInfo/user/"+username);
  access_log.info("BODY >>> " + req.body);

  if (username==undefined || token==undefined) {
    res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
  }
  else {
    UserModel.saveDeviceInfo(username, token, device_model,
      device_platform, device_version, device_manufacturer, device_serial, device_uuid,
      device_height, device_width, device_language, app_version, app_type, function(error, data) {
      if (data == null) {
        res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
      }
      else {
        //si existe enviamos el json
        if (data !== 'undefined') {
          res.status(200).json(data)
        } else {
          res.status(202).json({"response": {"status":status.STATUS_NOT_FOUND_REGISTER,"description":messages.MISSING_REGISTER}})
        }
      }
    });
  }
});

module.exports = router;
