var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('kyrosapi.properties');

var jwt = require('jwt-simple');
var UserModel = require('../models/user');
var status = require("../utils/statusCodes.js");
var messages = require("../utils/statusMessages.js");

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
  format : "{{timestamp}} {{message}}",
  dateformat : "HH:MM:ss.L",

    transport : function(data) {
        fs.open(properties.get('main.access_log.file'), 'a', 0666, function(e, id) {
            fs.write(id, data.output+"\n", null, 'utf8', function() {
                fs.close(id, function() {
                });
            });
        });
    }
});

function checkPermission(req, username, arrPermissionList) {
  access_log.info ("[" + username + "]: " + req.originalMethod + " -> " + req.originalUrl);
  
  // AREA
  if ( (req.path.lastIndexOf('/areas', 0) === 0) ) {
    if ((arrPermissionList.indexOf(properties.get('api.permission.area.read')) > -1 ) || (arrPermissionList.indexOf(properties.get('api.permission.area.admin')) > -1 ))
      return true;
  }
  else if (req.path.lastIndexOf('/area', 0) === 0) {
    if (req.method == 'GET'){
      if ((arrPermissionList.indexOf(properties.get('api.permission.area.read')) > -1 ) || (arrPermissionList.indexOf(properties.get('api.permission.area.admin')) > -1 ))
        return true;
    }
    else {
      if (arrPermissionList.indexOf(properties.get('api.permission.area.admin')) > -1 )
        return true;
    }
  }

  // ROUTE
  if (req.path.lastIndexOf('/routes', 0) === 0) {
    if ((arrPermissionList.indexOf(properties.get('api.permission.route.read')) > -1 ) || (arrPermissionList.indexOf(properties.get('api.permission.route.admin')) > -1 ))
      return true;
  }
  else if (req.path.lastIndexOf('/route', 0) === 0) {
    if (req.method == 'GET'){
      if ((arrPermissionList.indexOf(properties.get('api.permission.route.read')) > -1 ) || (arrPermissionList.indexOf(properties.get('api.permission.route.admin')) > -1 ))
        return true;
    }
    else {
      if (arrPermissionList.indexOf(properties.get('api.permission.route.admin')) > -1 )
        return true;
    }
  }

  // FLEET
  else if ( (req.path.lastIndexOf('/fleets', 0) === 0)  ){
    if ((arrPermissionList.indexOf(properties.get('api.permission.fleet.read')) > -1 ) || (arrPermissionList.indexOf(properties.get('api.permission.fleet.admin')) > -1 ))
      return true;
  }
  else if (req.path.lastIndexOf('/fleet', 0) === 0) {
    if (req.method == 'GET'){
      if ((arrPermissionList.indexOf(properties.get('api.permission.fleet.read')) > -1 ) || (arrPermissionList.indexOf(properties.get('api.permission.fleet.admin')) > -1 ))
        return true;
    }
    else {
      if (arrPermissionList.indexOf(properties.get('api.permission.fleet.admin')) > -1 )
        return true;
    }
  }

  // VEHICLE
  else if ( (req.path.lastIndexOf('/vehicles', 0) === 0)  ){
    if ((arrPermissionList.indexOf(properties.get('api.permission.vehicle.read')) > -1 ) || (arrPermissionList.indexOf(properties.get('api.permission.vehicle.admin')) > -1 ))
      return true;
  }
  else if (req.path.lastIndexOf('/vehicle', 0) === 0) {
    if (req.method == 'GET'){
      if ((arrPermissionList.indexOf(properties.get('api.permission.vehicle.read')) > -1 ) || (arrPermissionList.indexOf(properties.get('api.permission.vehicle.admin')) > -1 ))
        return true;
    }
    else {
      if (arrPermissionList.indexOf(properties.get('api.permission.vehicle.admin')) > -1 )
        return true;
    }
  }

  // TRACKING
  else if ( (req.path.lastIndexOf('/tracking', 0) === 0)  ){
    if ((arrPermissionList.indexOf(properties.get('api.permission.tracking.read')) > -1 ) || (arrPermissionList.indexOf(properties.get('api.permission.tracking.admin')) > -1 ))
      return true;
  }
  else if (req.path.lastIndexOf('/tracking', 0) === 0) {
    if (req.method == 'GET'){
      if ((arrPermissionList.indexOf(properties.get('api.permission.tracking.read')) > -1 ) || (arrPermissionList.indexOf(properties.get('api.permission.tracking.admin')) > -1 ))
        return true;
    }
    else {
      if (arrPermissionList.indexOf(properties.get('api.permission.tracking.admin')) > -1 )
        return true;
    }
  }


  /*else if (req.path.lastIndexOf('/tracking', 0) === 0) {
    return true;
  }*/

  return false;
}


module.exports = function(req, res, next) {
  //var token = (req.body && req.body.access_token) || (req.query && req.query.access_token) || req.headers['x-access-token'] || req.headers['x-access'];
  var token = req.headers['x-access-token'] || req.headers['x-access'];

  if (token) {
    try {
      if (token == '') {
         log.debug('Invalid token');
         res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.TOKEN_INCORRECT}})
        return;
      }

      var decoded = jwt.decode(token, require('../config/secret.js')());

      // Comprobar la expiracion del token
      var now = new Date;
      var timezone =  now.getTimezoneOffset()
      var milisecondsUTC = now.getTime() + (timezone*60*1000);
      if (decoded.exp <= milisecondsUTC) {
        log.info('Token Expired');
        res.status(202).json({"response": {"status":status.STATUS_LOGIN_INCORRECT,"description":messages.TOKEN_EXPIRED}})
        return;
      }

      // Comprobar la existencia del usuario
      var username = decoded.iss;
      if (username == '') {
        username = decoded.jti;
      }

      UserModel.getUserFromUsername(username,function(error, dbUser) {
          if (dbUser==null) {
            res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
            return;
          }
          if (typeof dbUser == 'undefined' || dbUser.length == 0) {
            log.debug('Invalid user');
            res.status(202).json({"response": {"status":status.STATUS_LOGIN_INCORRECT,"description":messages.LOGIN_INCORRECT}})
            return;
          }
          else {
            // Comprobar permisos
            if (checkPermission(req, dbUser[0].username, dbUser[0].api_permission))
              next();
            else {
              log.debug('Not allow');
              res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.NOT_ALLOW}})
            }


          }
      });

    } catch (err) {
        log.error("ERROR: "+err);
        res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.TOKEN_INCORRECT}})
   }
  } else {
    res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.TOKEN_INCORRECT}})
    return;
  }
}
