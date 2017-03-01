var express = require('express');
var router = express.Router();
var jwt = require('jwt-simple');
var crypto = require('crypto');
var crypt = require('crypt3');
var moment = require('moment');
var ldap = require('ldapjs');

var status = require("../utils/statusCodes.js");
var messages = require("../utils/statusMessages.js");

// Fichero de propiedades
var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('kyrosapi.properties');

var UserModel = require('../models/user');

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

/**
 * @api {post} /login/ Login to Kyros API
 * @apiName PostLogin
 * @apiGroup Login
 *
 * @apiDescription Login to Kyros SSO
 * @apiSampleRequest https://api.kyroslbs.com/login
 * @apiParam {String} username Username
 * @apiParam {String} password Password (SHA256)
 * @apiSuccess {String} message message with token information
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200
 *     {
 *         "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE0MzIyMjE4Njk1NTcsImlzcyI6InN1bW8iLCJyb2xlIjoiYWRtaW5pc3RyYXRvciJ9.3lHHWqKgeeEdX7XyvRV2BHA9YXJJ4u9UaeI5eXpTxGY",
 *         "expires": 1432221869557,
 *         "id": 1,
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
router.post("/login", function (req, res) {
  log.info("POST: /login");

  var username = req.query.username || req.body.username || req.params.username || '';
  var password = req.query.password || req.body.password || req.params.password || '';

  log.debug("  -> username: " + username);
  log.debug("  -> password: " + password);

  if (username == null || password == null) {
    res.status(202).json({ "response": { "status": status.STATUS_VALIDATION_ERROR, "description": messages.MISSING_PARAMETER } })
  }
  else {

    try {
      if (username == '' || password == '') {
        log.debug('Invalid credentials');
        res.status(202).json({ "response": { "status": status.STATUS_LOGIN_INCORRECT, "description": messages.LOGIN_INCORRECT } })
        return;
      }

      // Authorize the user to see if s/he can access our resources
      var passwordDB = '';

      UserModel.getUserFromUsername(username, function (error, dbUser) {
        if (dbUser == null) {
          res.status(202).json({ "response": { "status": status.STATUS_FAILURE, "description": messages.SERVER_ERROR } })
          return;
        }
        if (typeof dbUser == 'undefined' || dbUser.length == 0) {
          log.debug('Invalid user');
          res.status(202).json({ "response": { "status": status.STATUS_LOGIN_INCORRECT, "description": messages.LOGIN_INCORRECT } })
          return;
        }
        else {
          username = dbUser[0].username;
          passwordDB = dbUser[0].password;

          if (crypt(password, passwordDB) !== passwordDB) {
            log.debug('Invalid credentials');
            res.status(202).json({ "response": { "status": status.STATUS_LOGIN_INCORRECT, "description": messages.LOGIN_INCORRECT } })
          } else {
            log.debug('Login OK - Generando token');
            res.json(genToken(username, passwordDB));
          }
        }

      });
    } catch (err) {
      res.status(202).json({ "response": { "status": status.STATUS_FAILURE, "description": messages.SERVER_ERROR } })
    }
  }
});

router.post("/loginldap", function (req, res) {
  log.info("POST: /loginldap");

  var username = req.query.username || req.body.username || req.params.username || '';
  var password = req.query.password || req.body.password || req.params.password || '';

  log.debug("  -> username: " + username);
  log.debug("  -> password: " + password);

  var dn = "";
  var cn = "";

  if (username == null || password == null) {
    res.status(202).json({ "response": { "status": status.STATUS_VALIDATION_ERROR, "description": messages.MISSING_PARAMETER } })
  }
  else {

    try {
      if (username == '' || password == '') {
        log.debug('Invalid credentials');
        res.status(202).json({ "response": { "status": status.STATUS_LOGIN_INCORRECT, "description": messages.LOGIN_INCORRECT } })
        return;
      }

      // Authorize the user to see if s/he can access our resources
      var passwordDB = '';

      var adminClient = ldap.createClient({
        url: 'ldap://172.26.30.40:389'
      });

      adminClient.bind("cn=admin,dc=kyroslbs,dc=com", "dat1234", function (err) {

        adminClient.search("dc=kyroslbs,dc=com", {
          scope: "sub",
          filter: "(uid=" + "carm" + ")"
        }, function (err, ldapResult) {
          if (err != null)
            throw err;

          ldapResult.on("end", function () {
            if (dn === "") {
              log.debug('Invalid LDAP user');
              res.status(202).json({ "response": { "status": status.STATUS_LOGIN_INCORRECT, "description": messages.LOGIN_INCORRECT } })
            }
          });

          ldapResult.on('searchEntry', function (entry) {
            dn = entry.dn;
            cn = entry.object.cn;
            var passwordDB = entry.object.userPassword;
            var username = entry.object.uid;
            res.json(genToken(username, passwordDB));
            /*
                  if( crypt(password,passwordDB) !== passwordDB) {
                     log.debug('Invalid credentials');
                     res.status(202).json({"response": {"status":status.STATUS_LOGIN_INCORRECT,"description":messages.LOGIN_INCORRECT}})
                  } else {
                    log.debug('Login OK - Generando token');
                    res.json(genToken(username, passwordDB));
                  }
                  */

          });



        });


      });







    } catch (err) {
      res.status(202).json({ "response": { "status": status.STATUS_FAILURE, "description": messages.SERVER_ERROR } })
    }
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
  var utc_date = moment.parseZone(moment.utc() + 86400000 * numDays).utc().format('YYYY-MM-DDTHH:mm:ss.ssZ');
  var new_utc_date = utc_date.substring(0, utc_date.indexOf("+")) + "Z";
  return new_utc_date;
}

function expiresIn1Hour() {
  var now = new Date;
  var timezone = now.getTimezoneOffset()
  var milisecondsUTC = now.getTime() + (timezone * 60 * 1000);
  return milisecondsUTC + 3600000;
}

function expiresInMin(minutes) {
  var now = new Date;
  var milisecondsUTC = now.getTime();
  return milisecondsUTC + (minutes * 60 * 1000);
}

function expiresInMinISO(minutes) {
  var utc_date = moment.parseZone(moment.utc() + 350000).utc().format('YYYY-MM-DDTHH:mm:ss.ssZ');
  var new_utc_date = utc_date.substring(0, utc_date.indexOf("+")) + "Z";
  return new_utc_date;
}

module.exports = router;
