var status = require("../utils/statusCodes.js");
var messages = require("../utils/statusMessages.js");
var express = require('express');
var router = express.Router();
var jwt = require('jwt-simple');
var bodyParser = require('body-parser');
var UserModel = require('../models/user');
var crypto = require('crypto');
var moment 		= require('moment');

// Fichero de propiedades
var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('kyrosapi.properties');

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

/**
 * @api {post} /validate/ Validate token
 * @apiName PostValidate
 * @apiGroup Login
 *
 * @apiDescription Validate SUMO token
 * @apiSampleRequest https://api.kyroslbs.com/validate
 *
 * @apiParam {String} token JWT Token
 *
 * @apiSuccess {json} message message with result information
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *         "user": "my_username"
 *         "expires": "2017-02-10T16:09:19.19"
 *     }
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 400 Bad request
 *     {
 *       "message": "Invalid token"
 *     }
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 401 Not authorized
 *     {
 *       "message": "Token Expired"
 *     }
 */
  router.post("/validate", function(req,res)
  {
    log.info("POST: /validate");

    var token = req.body.token;
    log.debug("  -> token:   " + token);

    if (token == null) {
      res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
    }
    else
    {
      //var token = (req.body && req.body.access_token) || (req.query && req.query.access_token) || req.headers['x-access-token'];
      log.info('Peticion de validacion del token:'+token);

      if (token) {
          try {
            if (token == '') {
               log.debug('Invalid token');
               res.status(202).json({"response": {"status":status.STATUS_LOGIN_INCORRECT,"description":messages.TOKEN_INCORRECT}})
              return;
            }

            var decoded = jwt.decode(token, require('../config/secret.js')());

            // Comprobar la expiracion del token
            log.debug('Comprobar la expiracion del token: '+decoded.exp);
            if (decoded.exp <= Date.now()) {
              log.debug('Token Expired');
              res.status(202).json({"response": {"status":status.STATUS_LOGIN_INCORRECT,"description":messages.TOKEN_EXPIRED}})
              return;
            }

            // Comprobar la existencia del usuario
            //var userData = {username:decoded.iss};
            log.debug('Comprobar el usuario: '+decoded.iss);

            UserModel.getUserFromUsername(decoded.iss,function(error, dbUser) {
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
                log.debug('User valido');

                res.status(200);
                res.json({
                  user: decoded.iss,
                  expires: expiresInDaysISO(decoded.exp)
                });
                return;
              }

          });

        } catch (err) {
          res.status(202).json({"response": {"status":status.STATUS_LOGIN_INCORRECT,"description":messages.TOKEN_INCORRECT}})
       }

      }
      else
      {
        res.status(202).json({"response": {"status":status.STATUS_LOGIN_INCORRECT,"description":messages.TOKEN_INCORRECT}})
        return;
      }
    }
  });

function expiresInDaysISO(timestamp) {
  var utc_date = moment.parseZone(timestamp).utc().format('YYYY-MM-DDTHH:mm:ss.ssZ');
  var new_utc_date = utc_date.substring(0,utc_date.indexOf("+")) + "Z";
  return new_utc_date;
}


module.exports = router;
