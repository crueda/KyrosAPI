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

      //console.log("username:"+username);
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
            next();
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
