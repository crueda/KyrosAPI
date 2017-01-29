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


  // AREA
  if (req.path.lastIndexOf('/kyrosapi/areas', 0) === 0) {
    if ((arrServiceList.indexOf(properties.get('sumo.services.area.read')) > -1 ) || (arrServiceList.indexOf(properties.get('sumo.services.area.admin')) > -1 ))
      return true;
  }
  else if (req.path.lastIndexOf('/kyrosapi/area', 0) === 0) {
    if (req.method == 'GET'){
      if ((arrServiceList.indexOf(properties.get('sumo.services.area.read')) > -1 ) || (arrServiceList.indexOf(properties.get('sumo.services.area.admin')) > -1 ))
        return true;
    }
    else {
      if (arrServiceList.indexOf(properties.get('sumo.services.area.admin')) > -1 )
        return true;
    }
  }

  // BEACON
  if (req.path.lastIndexOf('/kyrosapi/beacons', 0) === 0) {
    if ((arrServiceList.indexOf(properties.get('sumo.services.area.read')) > -1 ) || (arrServiceList.indexOf(properties.get('sumo.services.area.admin')) > -1 ))
      return true;
  }
  else if (req.path.lastIndexOf('/kyrosapi/beacon', 0) === 0) {
    if (req.method == 'GET'){
      if ((arrServiceList.indexOf(properties.get('sumo.services.area.read')) > -1 ) || (arrServiceList.indexOf(properties.get('sumo.services.area.admin')) > -1 ))
        return true;
    }
    else {
      if (arrServiceList.indexOf(properties.get('sumo.services.area.admin')) > -1 )
        return true;
    }
  }

  // ROUTE
  if (req.path.lastIndexOf('/kyrosapi/routes', 0) === 0) {
    if ((arrServiceList.indexOf(properties.get('sumo.services.route.read')) > -1 ) || (arrServiceList.indexOf(properties.get('sumo.services.route.admin')) > -1 ))
      return true;
  }
  else if (req.path.lastIndexOf('/kyrosapi/route', 0) === 0) {
    if (req.method == 'GET'){
      if ((arrServiceList.indexOf(properties.get('sumo.services.route.read')) > -1 ) || (arrServiceList.indexOf(properties.get('sumo.services.route.admin')) > -1 ))
        return true;
    }
    else {
      if (arrServiceList.indexOf(properties.get('sumo.services.route.admin')) > -1 )
        return true;
    }
  }

  // BEACON
  if (req.path.lastIndexOf('/kyrosapi/beacons', 0) === 0) {
    if ((arrServiceList.indexOf(properties.get('sumo.services.route.read')) > -1 ) || (arrServiceList.indexOf(properties.get('sumo.services.route.admin')) > -1 ))
      return true;
  }
  else if (req.path.lastIndexOf('/kyrosapi/beacon', 0) === 0) {
    if (req.method == 'GET'){
      if ((arrServiceList.indexOf(properties.get('sumo.services.route.read')) > -1 ) || (arrServiceList.indexOf(properties.get('sumo.services.route.admin')) > -1 ))
        return true;
    }
    else {
      if (arrServiceList.indexOf(properties.get('sumo.services.route.admin')) > -1 )
        return true;
    }
  }

  // LOG
  else if (req.path.lastIndexOf('/kyrosapi/logs', 0) === 0) {
    if ((arrServiceList.indexOf(properties.get('sumo.services.log.read')) > -1 ) || (arrServiceList.indexOf(properties.get('sumo.services.log.admin')) > -1 ))
      return true;
  }
  else if (req.path.lastIndexOf('/kyrosapi/log', 0) === 0) {
    if (req.method == 'GET'){
      if ((arrServiceList.indexOf(properties.get('sumo.services.log.read')) > -1 ) || (arrServiceList.indexOf(properties.get('sumo.services.log.admin')) > -1 ))
        return true;
    }
    else {
      if (arrServiceList.indexOf(properties.get('sumo.services.log.admin')) > -1 )
        return true;
    }
  }

  // UXO
  else if (req.path.lastIndexOf('/kyrosapi/uxos', 0) === 0) {
    if ((arrServiceList.indexOf(properties.get('sumo.services.uxo.read')) > -1 ) || (arrServiceList.indexOf(properties.get('sumo.services.uxo.admin')) > -1 ))
      return true;
  }
  else if (req.path.lastIndexOf('/kyrosapi/uxo', 0) === 0) {
    if (req.method == 'GET'){
      if ((arrServiceList.indexOf(properties.get('sumo.services.uxo.read')) > -1 ) || (arrServiceList.indexOf(properties.get('sumo.services.uxo.admin')) > -1 ))
        return true;
    }
    else {
      if (arrServiceList.indexOf(properties.get('sumo.services.uxo.admin')) > -1 )
        return true;
    }
  }

  // PERSONNEL
  else if (req.path.lastIndexOf('/kyrosapi/personnels', 0) === 0) {
    if ((arrServiceList.indexOf(properties.get('sumo.services.personnel.read')) > -1 ) || (arrServiceList.indexOf(properties.get('sumo.services.personnel.admin')) > -1 ))
      return true;
  }
  else if (req.path.lastIndexOf('/kyrosapi/personnel', 0) === 0) {
    if (req.method == 'GET'){
      if ((arrServiceList.indexOf(properties.get('sumo.services.personnel.read')) > -1 ) || (arrServiceList.indexOf(properties.get('sumo.services.personnel.admin')) > -1 ))
        return true;
    }
    else {
      if (arrServiceList.indexOf(properties.get('sumo.services.personnel.admin')) > -1 )
        return true;
    }
  }

  // CERTIFICATE
  else if (req.path.lastIndexOf('/kyrosapi/certificates', 0) === 0) {
    if ((arrServiceList.indexOf(properties.get('sumo.services.personnel.read')) > -1 ) || (arrServiceList.indexOf(properties.get('sumo.services.personnel.admin')) > -1 ))
      return true;
  }
  else if (req.path.lastIndexOf('/kyrosapi/certificate', 0) === 0) {
    if (req.method == 'GET'){
      if ((arrServiceList.indexOf(properties.get('sumo.services.personnel.read')) > -1 ) || (arrServiceList.indexOf(properties.get('sumo.services.personnel.admin')) > -1 ))
        return true;
    }
    else {
      if (arrServiceList.indexOf(properties.get('sumo.services.personnel.admin')) > -1 )
        return true;
    }
  }

  // TASK
  else if (req.path.lastIndexOf('/kyrosapi/tasks', 0) === 0) {
    if ((arrServiceList.indexOf(properties.get('sumo.services.task.read')) > -1 ) || (arrServiceList.indexOf(properties.get('sumo.services.task.admin')) > -1 ))
      return true;
  }
  else if (req.path.lastIndexOf('/kyrosapi/task', 0) === 0) {
    if (req.method == 'GET'){
      if ((arrServiceList.indexOf(properties.get('sumo.services.task.read')) > -1 ) || (arrServiceList.indexOf(properties.get('sumo.services.task.admin')) > -1 ))
        return true;
    }
    else {
      if (arrServiceList.indexOf(properties.get('sumo.services.task.admin')) > -1 )
        return true;
    }
  }

  // SWIPE
  else if (req.path.lastIndexOf('/kyrosapi/swipes', 0) === 0) {
    if ((arrServiceList.indexOf(properties.get('sumo.services.personal_device.read')) > -1 ) || (arrServiceList.indexOf(properties.get('sumo.services.personal_device.admin')) > -1 ))
      return true;
  }
  else if (req.path.lastIndexOf('/kyrosapi/swipe', 0) === 0) {
    if (req.method == 'GET'){
      if ((arrServiceList.indexOf(properties.get('sumo.services.personal_device.read')) > -1 ) || (arrServiceList.indexOf(properties.get('sumo.services.personal_device.admin')) > -1 ))
        return true;
    }
    else {
      if (arrServiceList.indexOf(properties.get('sumo.services.personal_device.admin')) > -1 )
        return true;
    }
  }

  // USER
  else if (req.path.lastIndexOf('/kyrosapi/users', 0) === 0) {
    if ((arrServiceList.indexOf(properties.get('sumo.services.user.read')) > -1 ) || (arrServiceList.indexOf(properties.get('sumo.services.user.admin')) > -1 ))
      return true;
  }
  else if (req.path.lastIndexOf('/kyrosapi/user', 0) === 0) {
    if (req.method == 'GET'){
      if ((arrServiceList.indexOf(properties.get('sumo.services.user.read')) > -1 ) || (arrServiceList.indexOf(properties.get('sumo.services.user.admin')) > -1 ))
        return true;
    }
    else {
      if (arrServiceList.indexOf(properties.get('sumo.services.user.admin')) > -1 )
        return true;
    }
  }

  // ALARM
  else if (req.path.lastIndexOf('/kyrosapi/alarms', 0) === 0) {
    if ((arrServiceList.indexOf(properties.get('sumo.services.alarm.read')) > -1 ) || (arrServiceList.indexOf(properties.get('sumo.services.alarm.admin')) > -1 ))
      return true;
  }
  else if (req.path.lastIndexOf('/kyrosapi/alarm', 0) === 0) {
    if (req.method == 'GET'){
      if ((arrServiceList.indexOf(properties.get('sumo.services.alarm.read')) > -1 ) || (arrServiceList.indexOf(properties.get('sumo.services.alarm.admin')) > -1 ))
        return true;
    }
    else {
      if (arrServiceList.indexOf(properties.get('sumo.services.alarm.admin')) > -1 )
        return true;
    }
  }

  // VESSEL
  else if (req.path.lastIndexOf('/kyrosapi/vessels', 0) === 0) {
    if ((arrServiceList.indexOf(properties.get('sumo.services.vessel.read')) > -1 ) || (arrServiceList.indexOf(properties.get('sumo.services.vessel.admin')) > -1 ))
      return true;
  }
  else if (req.path.lastIndexOf('/kyrosapi/vessel', 0) === 0) {
    if (req.method == 'GET'){
      if ((arrServiceList.indexOf(properties.get('sumo.services.vessel.read')) > -1 ) || (arrServiceList.indexOf(properties.get('sumo.services.vessel.admin')) > -1 ))
        return true;
    }
    else {
      if (arrServiceList.indexOf(properties.get('sumo.services.vessel.admin')) > -1 )
        return true;
    }
  }

  // SUBSCRIPTION
  else if (req.path.lastIndexOf('/listener/subscribe', 0) === 0) {
    if (arrServiceList.indexOf(properties.get('sumo.services.subscription.create')) > -1 )
      return true;
  }
  else if (req.path.lastIndexOf('/listener/unsubscribe', 0) === 0) {
    if (arrServiceList.indexOf(properties.get('sumo.services.subscription.delete')) > -1 )
      return true;
  }
  else if (req.path.lastIndexOf('/listener/unsubscribeAll', 0) === 0) {
    if (arrServiceList.indexOf(properties.get('sumo.services.subscription.delete')) > -1 )
      return true;
  }

  // WINDMILL
  else if (req.path.lastIndexOf('/kyrosapi/windmills', 0) === 0) {
    if ((arrServiceList.indexOf(properties.get('sumo.services.windfarm.read')) > -1 ) || (arrServiceList.indexOf(properties.get('sumo.services.windfarm.admin')) > -1 ))
      return true;
  }
  else if (req.path.lastIndexOf('/kyrosapi/windmill', 0) === 0) {
    if (req.method == 'GET'){
      if ((arrServiceList.indexOf(properties.get('sumo.services.windfarm.read')) > -1 ) || (arrServiceList.indexOf(properties.get('sumo.services.windfarm.admin')) > -1 ))
        return true;
    }
    else {
      if (arrServiceList.indexOf(properties.get('sumo.services.windfarm.admin')) > -1 )
        return true;
    }
  }

  // CABLING
  else if (req.path.lastIndexOf('/kyrosapi/cablings', 0) === 0) {
    if ((arrServiceList.indexOf(properties.get('sumo.services.windfarm.read')) > -1 ) || (arrServiceList.indexOf(properties.get('sumo.services.windfarm.admin')) > -1 ))
      return true;
  }
  else if (req.path.lastIndexOf('/kyrosapi/cabling', 0) === 0) {
    if (req.method == 'GET'){
      if ((arrServiceList.indexOf(properties.get('sumo.services.windfarm.read')) > -1 ) || (arrServiceList.indexOf(properties.get('sumo.services.windfarm.admin')) > -1 ))
        return true;
    }
    else {
      if (arrServiceList.indexOf(properties.get('sumo.services.windfarm.admin')) > -1 )
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
  // Add New Personnel’s Swipe
  else if (req.path.lastIndexOf('/PersonnelSwipe', 0) === 0) {
    return true;
  }
  // Add New AIS message
  else if (req.path.lastIndexOf('/AISMessage', 0) === 0) {
    return true;
  }
  // ROLE
  else if (req.path.lastIndexOf('/kyrosapi/rol', 0) === 0) {
    return true;
  }
  // SERVICE
  else if (req.path.lastIndexOf('/kyrosapi/service', 0) === 0) {
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
