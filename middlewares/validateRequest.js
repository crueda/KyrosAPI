var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('./api.properties');

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

function checkPermission(req, serviceList) {

  //console.log("metodo: " + req.method);
  //console.log("url: " + req.path);
  //console.log("servicios:" + serviceList);
  var arrServiceList = serviceList.split(",");


  // TRACKING
  if (req.path.lastIndexOf('/kyrosapi/trackings', 0) === 0) {
    if ((arrServiceList.indexOf(properties.get('kyros.services.area.read')) > -1 ) || (arrServiceList.indexOf(properties.get('kyros.services.tracking.admin')) > -1 ))
      return true;
  }
  else if (req.path.lastIndexOf('/kyrosapi/tracking', 0) === 0) {
    if (req.method == 'GET'){
      if ((arrServiceList.indexOf(properties.get('kyros.services.tracking.read')) > -1 ) || (arrServiceList.indexOf(properties.get('kyros.services.tracking.admin')) > -1 ))
        return true;
    }
    else {
      if (arrServiceList.indexOf(properties.get('kyros.services.tracking.admin')) > -1 )
        return true;
    }
  }

  // AREA
  if (req.path.lastIndexOf('/kyrosapi/areas', 0) === 0) {
    if ((arrServiceList.indexOf(properties.get('kyros.services.area.read')) > -1 ) || (arrServiceList.indexOf(properties.get('kyros.services.area.admin')) > -1 ))
      return true;
  }
  else if (req.path.lastIndexOf('/kyrosapi/area', 0) === 0) {
    if (req.method == 'GET'){
      if ((arrServiceList.indexOf(properties.get('kyros.services.area.read')) > -1 ) || (arrServiceList.indexOf(properties.get('kyros.services.area.admin')) > -1 ))
        return true;
    }
    else {
      if (arrServiceList.indexOf(properties.get('kyros.services.area.admin')) > -1 )
        return true;
    }
  }

  // VERTEX
  if (req.path.lastIndexOf('/kyrosapi/vertexes', 0) === 0) {
    if ((arrServiceList.indexOf(properties.get('kyros.services.area.read')) > -1 ) || (arrServiceList.indexOf(properties.get('kyros.services.area.admin')) > -1 ))
      return true;
  }
  else if (req.path.lastIndexOf('/kyrosapi/vertex', 0) === 0) {
    if (req.method == 'GET'){
      if ((arrServiceList.indexOf(properties.get('kyros.services.area.read')) > -1 ) || (arrServiceList.indexOf(properties.get('kyros.services.area.admin')) > -1 ))
        return true;
    }
    else {
      if (arrServiceList.indexOf(properties.get('kyros.services.area.admin')) > -1 )
        return true;
    }
  }

  // ROUTE
  if (req.path.lastIndexOf('/kyrosapi/routes', 0) === 0) {
    if ((arrServiceList.indexOf(properties.get('kyros.services.route.read')) > -1 ) || (arrServiceList.indexOf(properties.get('kyros.services.route.admin')) > -1 ))
      return true;
  }
  else if (req.path.lastIndexOf('/kyrosapi/route', 0) === 0) {
    if (req.method == 'GET'){
      if ((arrServiceList.indexOf(properties.get('kyros.services.route.read')) > -1 ) || (arrServiceList.indexOf(properties.get('kyros.services.route.admin')) > -1 ))
        return true;
    }
    else {
      if (arrServiceList.indexOf(properties.get('kyros.services.route.admin')) > -1 )
        return true;
    }
  }

  // BEACON
  if (req.path.lastIndexOf('/kyrosapi/beacons', 0) === 0) {
    if ((arrServiceList.indexOf(properties.get('kyros.services.route.read')) > -1 ) || (arrServiceList.indexOf(properties.get('kyros.services.route.admin')) > -1 ))
      return true;
  }
  else if (req.path.lastIndexOf('/kyrosapi/beacon', 0) === 0) {
    if (req.method == 'GET'){
      if ((arrServiceList.indexOf(properties.get('kyros.services.route.read')) > -1 ) || (arrServiceList.indexOf(properties.get('kyros.services.route.admin')) > -1 ))
        return true;
    }
    else {
      if (arrServiceList.indexOf(properties.get('kyros.services.route.admin')) > -1 )
        return true;
    }
  }

  // USER
  else if (req.path.lastIndexOf('/kyrosapi/users', 0) === 0) {
    if ((arrServiceList.indexOf(properties.get('kyros.services.user.read')) > -1 ) || (arrServiceList.indexOf(properties.get('kyros.services.user.admin')) > -1 ))
      return true;
  }
  else if (req.path.lastIndexOf('/kyrosapi/user', 0) === 0) {
    if (req.method == 'GET'){
      if ((arrServiceList.indexOf(properties.get('kyros.services.user.read')) > -1 ) || (arrServiceList.indexOf(properties.get('kyros.services.user.admin')) > -1 ))
        return true;
    }
    else {
      if (arrServiceList.indexOf(properties.get('kyros.services.user.admin')) > -1 )
        return true;
    }
  }


  // LOGIN
  else if (req.path.lastIndexOf('/login', 0) === 0) {
    return true;
  }
  // VALIDATE
  else if (req.path.lastIndexOf('/validate', 0) === 0) {
    return true;
  }
  // STATUS
  else if (req.path.lastIndexOf('/kyrosapi/Status', 0) === 0) {
    return true;
  }
  // LAYER
  else if (req.path.lastIndexOf('/kyrosapi/layer', 0) === 0) {
    return true;
  }

  

  return false;
}

module.exports = function(req, res, next) {

  var token = (req.body && req.body.access_token) || (req.query && req.query.access_token) || req.headers['x-access-token'];

  if (token) {
    try {
      if (token == '') {
         log.debug('Invalid token');
         res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.TOKEN_INCORRECT}})
        return;
      }

//console.log(">>>");

      var decoded = jwt.decode(token, require('../config/secret.js')());

      // Comprobar la expiracion del token
      if (decoded.exp <= Date.now()) {
        log.info('Token Expired');
        res.status(202).json({"response": {"status":status.STATUS_LOGIN_INCORRECT,"description":messages.TOKEN_EXPIRED}})
        return;
      }

      // Comprobar la existencia del usuario
      var username = decoded.iss;
      //console.log("username:"+username);
      UserModel.getUserWithServicesFromUsername(username,function(error, dbUser) {
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
            if (checkPermission(req, dbUser[0].serviceList))
              next();
            else {
              log.debug('Not allow');
              res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.NOT_ALLOW}})
            }
          }

      });

    } catch (err) {
      log.error("ERROR: "+err);
      res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.SERVER_ERROR}})
   }
  } else {
    res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.TOKEN_INCORRECT}})
    return;
  }
}
