var express = require('express');
var router = express.Router();
var jwt = require('jwt-simple');

var status = require("../utils/statusCodes.js");
var messages = require("../utils/statusMessages.js");

// Fichero de propiedades
var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('kyrosapi.properties');

var LoginModel = require('../models/login');

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

router.get('/app/login/', function(req, res)
{
    log.info("GET: /login");
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
        LoginModel.login(username, password, function(error, data)
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

// private method
function genToken(username) {
  var expires = expiresIn1Hour();
  //var expires = expiresInMin(5); // 1 day
  //var expiresISO = expiresInMinISO(5); // 5 minutes
  var token = jwt.encode({
    exp: expires,
    iss: username
  }, require('../config/secret')());

  return token;
}

function expiresIn(numDays) {
  var dateObj = new Date();
  return dateObj.setDate(dateObj.getDate() + numDays);
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
