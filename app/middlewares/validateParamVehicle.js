var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('kyrosapi.properties');

var jwt = require('jwt-simple');
var VehicleModel = require('../models/vehicle');
var UserModel = require('../models/user');
var status = require("../utils/statusCodes.js");
var messages = require("../utils/statusMessages.js");

// Definición del log
var fs = require('fs');
var log = require('tracer').console({
  transport: function (data) {
    //console.log(data.output);
    fs.open(properties.get('main.log.file'), 'a', 0666, function (e, id) {
      fs.write(id, data.output + "\n", null, 'utf8', function () {
        fs.close(id, function () {
        });
      });
    });
  }
});

function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

module.exports = function (req, res, next) {
  var token = req.headers['x-access-token'] || req.headers['x-access'];

  if (token) {
    try {
      if (token == '') {
        log.debug('Invalid token');
        res.status(202).json({ "response": { "status": status.STATUS_FAILURE, "description": messages.TOKEN_INCORRECT } })
        return;
      }

      var decoded = jwt.decode(token, require('../config/secret.js')());

      var username = decoded.iss;
      if (username == '') {
        username = decoded.jti;
      }

      var paramDeviceId = 0;
      for (var attributename in req.params) {
        paramDeviceId = req.params[attributename];
      }
      paramDeviceId = parseInt(paramDeviceId);
      if (!isNumber(paramDeviceId))
        paramDeviceId = 0;

      UserModel.getUserFromUsername(username, function (error, userData) {
        if (userData[0].kind_monitor == 2) {
          next();
        } else {

          VehicleModel.getVehiclesFromUsername(username, function (error, data) {
            if (data.indexOf(paramDeviceId) > -1) {
              next();
            }
            else {
              log.debug('Not allow');
              res.status(202).json({ "response": { "status": status.STATUS_VALIDATION_ERROR, "description": messages.NOT_ALLOW } })
            }
          });
        }
      });

    } catch (err) {
      log.error("ERROR: " + err);
      res.status(202).json({ "response": { "status": status.STATUS_FAILURE, "description": messages.TOKEN_INCORRECT } })
    }
  } else {
    res.status(202).json({ "response": { "status": status.STATUS_FAILURE, "description": messages.TOKEN_INCORRECT } })
    return;
  }
}
