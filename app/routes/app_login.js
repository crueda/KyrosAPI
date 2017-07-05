var express = require('express');
var router = express.Router();
var jwt = require('jwt-simple');
var crypto 		= require('crypto');
var crypt     = require('crypt3');
var moment 		= require('moment');

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


/*
* LOGIN DE LA APP
*/
router.get('/app/login/', function(req, res)
{
    log.info("GET: /app/login");
    var version = req.query.version;
    var username = req.query.username;
    var password = req.query.password;

    if (version==undefined) {
      version = 3;
    }
      if (username==null || password==null) {
        res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
      }
      else if (version < 3) {
        res.status(202).json({"status": "msg", "title": "Versión incorrecta", "message": "Por favor, consulte con logistica@kyroslbs.com para actualizar su aplicación"});
      }
      else {
        UserModel.loginApp(username, password, function(error, data)
        {
          if (data == null)
          {
            res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
          }
          else
          {
            //Autenticación correcta
            if (typeof data.result !== 'undefined')
            {
              var token_api = genToken(username);
              data.result[0].token_api = token_api;
              res.status(200).json(data);
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

router.post('/app/login/', function(req, res)
{
    log.info("POST: /app/login");
    var version = req.body.version;
    var username = req.body.username;
    var password = req.body.password;
    var app_type = req.body.app_type;

    if (app_type==undefined)
      app_type = "mypush";

    //if (version==undefined) {
    //  version = 3;
    //}
      if (username==null || password==null) {
        res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
      }
      //else if (version < 3) {
      //  res.status(202).json({"status": "msg", "title": "Versión incorrecta", "message": "Por favor, consulte con logistica@kyroslbs.com para actualizar su aplicación"});
      //}
      else {
        UserModel.loginApp(username, password, app_type, function(error, data)
        {
          if (data == null)
          {
            res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
          }
          else
          {
            //Autenticación correcta
            if (typeof data.result !== 'undefined')
            {
              var token_api = genToken(username);
              data.result[0].token_api = token_api;
              res.status(200).json(data);
            }
            else
            {
              res.status(200).json(data);
            }
          }
        });
      }
});

// private method
function genToken(username, password) {
  var expires = expiresInDays(7); // 7 dias
  var expiresISO = expiresInDaysISO(7); // 7 dias
  var token = jwt.encode({
    exp: expires,
    iss: username,
    sub: password
  }, require('../config/secret')());

  return {
    user: username,
    token: token,
    //expires: expires,
    expires: expiresISO
  };
}

function expiresInDays(numDays) {
  var dateObj = new Date();
  return dateObj.setDate(dateObj.getDate() + numDays);
}

function expiresInDaysISO(numDays) {
  var utc_date = moment.parseZone(moment.utc()+86400000*numDays).utc().format('YYYY-MM-DDTHH:mm:ss.ssZ');
  var new_utc_date = utc_date.substring(0,utc_date.indexOf("+")) + "Z";
  return new_utc_date;
}

function expiresIn1Hour() {
  var now = new Date;
  var timezone =  now.getTimezoneOffset()
  var milisecondsUTC = now.getTime() + (timezone*60*1000);
  return milisecondsUTC + 3600000;
}

function expiresInMin(minutes) {
  var now = new Date;
  var milisecondsUTC = now.getTime();
  return milisecondsUTC + (minutes * 60 * 1000);
}

function expiresInMinISO(minutes) {
  var utc_date = moment.parseZone(moment.utc()+350000).utc().format('YYYY-MM-DDTHH:mm:ss.ssZ');
  var new_utc_date = utc_date.substring(0,utc_date.indexOf("+")) + "Z";
  return new_utc_date;
}

module.exports = router;
