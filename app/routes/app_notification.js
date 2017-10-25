var express = require('express');
var router = express.Router();

var status = require("../utils/statusCodes.js");
var messages = require("../utils/statusMessages.js");

// Fichero de propiedades
var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('kyrosapi.properties');

var NotificationModel = require('../models/notification');

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

router.get('/app/notifications', function(req, res)
{
    var username = req.query.username;

      log.info("GET: /notification?username="+username);

      if (username==null) {
        res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
      }
      else {
        NotificationModel.getAllNotifications(username, function(error, data)
        {
          if (data == null)
          {
            res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
          }
          else
          {
            //si existe enviamos el json
            if (data !== 'undefined' && data.length > 0)
            {
              res.status(200).json(data)
            }
            else if (data == 'undefined' || data.length == 0)
            {
              res.status(200).json([])
            }
            else
            {
              res.status(202).json({"response": {"status":status.STATUS_NOT_FOUND_REGISTER,"description":messages.MISSING_REGISTER}})
            }
          }
        });
      }
});


router.post('/app/notificationLimit', function(req, res)
{
    var username = req.body.username;
    var max = req.body.max;
    var group = req.body.group;
    if (max==undefined) {
      max = 100;
    }
    if (group==undefined) {
      group = 0;
    }
      log.info("POST: /app/notificationLimit?username="+username+"&max="+max);

      if (username==null) {
        res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
      }
      else {
        NotificationModel.getLastNotifications(username, max, group, function(error, data)
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
            //en otro caso mostramos un error
            else
            {
              res.status(202).json({"response": {"status":status.STATUS_NOT_FOUND_REGISTER,"description":messages.MISSING_REGISTER}})
            }
          }
        });
      }
});

router.post('/app/notificationLast', function(req, res)
{
    var username = req.body.username;
    var timestamp = req.body.timestamp;
      log.info("POST: /app/notificationLast?username="+username+"&timestamp="+timestamp);

      if (username==null || timestamp==null) {
        res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
      }
      else {
        NotificationModel.getLastNotificationsTimestamp(username, timestamp, function(error, data)
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
            //en otro caso mostramos un error
            else
            {
              res.status(202).json({"response": {"status":status.STATUS_NOT_FOUND_REGISTER,"description":messages.MISSING_REGISTER}})
            }
          }
        });
      }
});

//deprecated
router.get('/app/notification/archive', function(req, res)
{
      var username = req.query.username;
      var notificationId = req.query.notificationId;

      log.info("GET: /notification/archive?username="+username + "&notificationId="+notificationId);

      if (username==null || notificationId==null) {
        res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
      }
      else {
        NotificationModel.archiveNotification(username, notificationId, function(error, data)
        {
          if (data == null)
          {
            res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
          }
          else
          {
            //si existe enviamos el json
            if (data !== 'undefined' && data.length > 0)
            {
              res.status(200).json(data)
            }
            else if (data == 'undefined' || data.length == 0)
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

router.post('/app/notification/archive', function(req, res)
{
      var username = req.body.username;
      var notificationId = req.body.notificationId;

      log.info("POST: /notification/archive");
      access_log.info("BODY >>> " + req.body);

      if (username==null || notificationId==null) {
        res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
      }
      else {
        NotificationModel.archiveNotification(username, notificationId, function(error, data)
        {
          if (data == null)
          {
            res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
          }
          else
          {
            //si existe enviamos el json
            if (data !== 'undefined' && data.length > 0)
            {
              res.status(200).json(data)
            }
            else if (data == 'undefined' || data.length == 0)
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

router.get('/app/notification/archive/user/:username', function(req, res)
{
      var username = req.params.username;

      log.info("GET: /notification/archive/user/"+username);

      if (username==null) {
        res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
      }
      else {
        NotificationModel.archiveAllNotifications(username, function(error, data)
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
              res.status(200).json("ok")
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


router.post('/app/notification/config/user/:username', function(req, res)
{
  var username = req.params.username;
  var deviceId = req.body.deviceId;

  log.info("POST: /notification/config/user/"+username);
  access_log.info("BODY >>> " + req.body);

  if (username==null || deviceId==null) {
    res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
  }
  else {
    NotificationModel.getConfigNotifications(username, deviceId, function(error, data) {
      if (data == null) {
          res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
      } else {
        if (data !== 'undefined' && data.length > 0) {
          res.status(200).json(data)
        } else if (data == 'undefined' || data.length == 0) {
          res.status(200).json([])
        } else {
          res.status(202).json({"response": {"status":status.STATUS_NOT_FOUND_REGISTER,"description":messages.MISSING_REGISTER}})
        }
      }
    });
  }
});

router.post('/app/notification/setToken', function(req, res)
{
      var username = req.body.username;
      var token = req.body.token;

      log.info("POST: /notification/setToken");
      access_log.info("BODY >>> " + req.body);

      if (username==null || token==null) {
        res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
      }
      else {
        NotificationModel.saveToken(username, token, function(error, data)
        {
          if (data == null)
          {
            res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
          }
          else
          {
            //si existe enviamos el json
            if (data !== 'undefined' && data.length > 0)
            {
              res.status(200).json(data)
            }
            else if (data == 'undefined' || data.length == 0)
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

router.get('/app/notification/config/add', function(req, res)
{
      var username = req.query.username;
      var vehicleLicense = req.query.vehicleLicense;
      var eventIdList = req.query.eventIdList;

      log.info("GET: /notification/config/add?username="+username + "&vehicleLicense=" + vehicleLicense + "&eventIdList="+eventIdList);

      if (username==null || vehicleLicense==null || eventIdList==null) {
        res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
      }
      else {
        NotificationModel.configNotificationAdd(username, vehicleLicense, eventIdList, function(error, data)
        {
          if (data == null)
          {
            res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
          }
          else
          {
            //si existe enviamos el json
            if (data !== 'undefined' && data.length > 0)
            {
              res.status(200).json(data)
            }
            else if (data == 'undefined' || data.length == 0)
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

router.get('/app/notification/config/remove', function(req, res)
{
      var username = req.query.username;
      var vehicleLicense = req.query.vehicleLicense;
      var eventIdList = req.query.eventIdList;

      log.info("GET: /notification/config/remove?username="+username + "&vehicleLicense=" + vehicleLicense + "&eventIdList="+eventIdList);

      if (username==null || vehicleLicense==null || eventIdList==null) {
        res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
      }
      else {
        NotificationModel.configNotificationRemove(username, vehicleLicense, eventIdList, function(error, data)
        {
          if (data == null)
          {
            res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
          }
          else
          {
            //si existe enviamos el json
            if (data !== 'undefined' && data.length > 0)
            {
              res.status(200).json(data)
            }
            else if (data == 'undefined' || data.length == 0)
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


router.post('/app/notification/config/change', function(req, res)
{
      var username = req.body.username;
      var deviceId = req.body.deviceId;
      var eventType = req.body.event_type;
      var enabled = req.body.enabled;

      log.info("POST: /notification/config/change");
      access_log.info("BODY >>> " + req.body);

      if (username==null || deviceId==null || eventType==null) {
        res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
      }
      else {
        NotificationModel.configNotificationChange(username, deviceId, eventType, enabled, function(error, data)
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
        });
      }
});



router.get('/app/notification/enable/user/:username', function(req, res)
{
      var username = req.params.username;

      log.info("GET: /notification/enable/user/"+username);

      if (username==null) {
        res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
      }
      else {
        NotificationModel.enableUserNotifications(username, function(error, data)
        {
          if (data == null)
          {
            res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
          }
          else
          {
            //si existe enviamos el json
            if (data !== 'undefined' && data.length > 0)
            {
              res.status(200).json(data)
            }
            else if (data == 'undefined' || data.length == 0)
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

router.get('/app/notification/disable/user/:username', function(req, res)
{
      var username = req.params.username;

      log.info("GET: /notification/disable/user/"+username);

      if (username==null) {
        res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
      }
      else {
        NotificationModel.disableUserNotifications(username, function(error, data)
        {
          if (data == null)
          {
            res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
          }
          else
          {
            //si existe enviamos el json
            if (data !== 'undefined' && data.length > 0)
            {
              res.status(200).json(data)
            }
            else if (data == 'undefined' || data.length == 0)
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

//deprecated. app v1.3
router.get('/app/notification/status/user/:username', function(req, res)
{
      var username = req.params.username;

      log.info("GET: /notification/status/user/"+username);

      if (username==null) {
        res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
      }
      else {
        NotificationModel.statusUserNotifications(username, function(error, data)
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
            //en otro caso mostramos un error
            else
            {
              res.status(202).json({"response": {"status":status.STATUS_NOT_FOUND_REGISTER,"description":messages.MISSING_REGISTER}})
            }
          }
        });
      }
});

router.get('/app/notification/status', function(req, res)
{
    var username = req.query.username;
    var vehicleLicense = req.query.vehicleLicense;

      log.info("GET: /notification/status/?username="+username+"&vehicleLicense="+vehicleLicense);

      if (username==null || vehicleLicense==null) {
        res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
      }
      else {
        NotificationModel.statusUserVehicleNotifications(username, vehicleLicense, function(error, data)
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
