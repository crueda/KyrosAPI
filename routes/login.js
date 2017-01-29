var status = require("../utils/statusCodes.js");
var messages = require("../utils/statusMessages.js");
var express = require('express');
var router = express.Router();
var jwt = require('jwt-simple');
var bodyParser = require('body-parser');
var UserModel = require('../models/user.js');
var crypto = require('crypto');

// Fichero de propiedades
var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('./api.properties');

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
 * @api {post} /login/ Login to Single-SignOn platform
 * @apiVersion 1.0.0
 * @apiName PostLogin
 * @apiGroup Login
 *
 * @apiDescription Login to Kyros SSO
 * @apiSampleRequest https://api.kyroslbs.com/login
 * @apiParam {String} username Username
 * @apiParam {String} password Password (MD5)
 * @apiSuccess {String} message message with token information
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200
 *     {
 *         "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE0MzIyMjE4Njk1NTcsImlzcyI6InN1bW8iLCJyb2xlIjoiYWRtaW5pc3RyYXRvciJ9.3lHHWqKgeeEdX7XyvRV2BHA9YXJJ4u9UaeI5eXpTxGY",
 *         "expires": 1432221869557,
 *         "user": "my_username"
 *     }
 * @apiErrorExample {json} Error-Response:
 *     https/1.1 202
 *     {
 *     "response": {
 *        "status": -5,
 *        "description": "Invalid user or password"
 *      }
 *     }
 * @apiErrorExample {json} Error-Response:
 *     https/1.1 202
 *     {
 *     "response": {
 *        "status": -4,
 *        "description": "Missing parameter"
 *      }
 *     }
 */
  router.post("/login", function(req,res)
  {
    log.info("POST: /login");

    var username = req.query.username || req.body.username ||  req.params.username || '';
    var password = req.query.password || req.body.password ||  req.params.password || '';

    log.debug("  -> username: " + username);
    log.debug("  -> password: " + password);

    if (username == null || password == null) {
      res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
    }
    else
    {

      try {
        if (username == '' || password == '') {
         log.debug('Invalid credentials');
         res.status(202).json({"response": {"status":status.STATUS_LOGIN_INCORRECT,"description":messages.LOGIN_INCORRECT}})
         return;
      }

     // Authorize the user to see if s/he can access our resources
     var passwordDB = '';
     var roleDB = '';
     UserModel.getUserFromUsername(username,function(error, dbUser) {
         if (dbUser==null) {
           res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.SERVER_ERROR}})
           return;
         }

         if (typeof dbUser == 'undefined' || dbUser.length == 0) {
           log.debug('Invalid user');
           res.status(202).json({"response": {"status":status.STATUS_LOGIN_INCORRECT,"description":messages.LOGIN_INCORRECT}})
           return;
         }
         else {
           id = dbUser[0].id;
           passwordDB = dbUser[0].password;
           roleDB = dbUser[0].role;

           //var md5 = require('md5');
           //console.log("md5---->"+md5('crueda'));

           if (password!=passwordDB) {
               log.debug('Invalid credentials');
               res.status(202).json({"response": {"status":status.STATUS_LOGIN_INCORRECT,"description":messages.LOGIN_INCORRECT}})
           }
           else {
             log.debug('Login OK - Generando token');
             // enviar el evento
             var eventManager = new EventManager();
             var eventData = {
                 eventType : properties.get('sumo.event.login'),
                 resourceId: id
             };
             eventManager.sendEvent(eventData);

             res.json(genToken(id, username, roleDB));
           }
       }

     });
   } catch (err) {
     res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.SERVER_ERROR}})
   }
 }
});

// private method
function genToken(id, username, role) {
  var expires = expiresIn(7); // 7 days
  var token = jwt.encode({
    exp: expires,
    iss: username,
    role: role
  }, require('../config/secret')());

  return {
    id: id,
    user: username,
    role: role,
    token: token,
    expires: expires
  };
}

function expiresIn(numDays) {
  var dateObj = new Date();
  return dateObj.setDate(dateObj.getDate() + numDays);
}

module.exports = router;
