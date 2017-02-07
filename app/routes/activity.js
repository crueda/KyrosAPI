var express = require('express');
var router = express.Router();
var jsonfy = require('jsonfy');
var moment = require('moment');

var status = require("../utils/statusCodes.js");
var messages = require("../utils/statusMessages.js");

// Fichero de propiedades
var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('kyrosapi.properties');

var ActivityModel = require('../models/activity');

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
* @apiDefine LoginError
*
* @apiError UserNotFound The id of the User was not found
*
* @apiErrorExample Error-Response:
*     https/1.1 202
*     {
*     "response": {
*        "status": -5,
*        "description": "Invalid user or password"
*      }
*     }
*/

/**
* @apiDefine PermissionError
*
* @apiError NotAllow Access not allow to User
*
* @apiErrorExample Error-Response:
*     https/1.1 202
*     {
*     "response": {
*        "status": -4,
*        "description": "User not authorized"
*      }
*     }
*/

/** @apiDefine TokenError
*
* @apiError TokenInvalid The token is invalid
*
* @apiErrorExample Error-Response:
*     https/1.1 202
*     {
*     "response": {
*        "status": -5,
*        "description": "Invalid token"
*      }
*     }
*/

/** @apiDefine TokenExpiredError
*
* @apiError TokenExpired The token is expired
*
* @apiErrorExample Error-Response:
*     https/1.1 202
*     {
*     "response": {
*        "status": -5,
*        "description": "Token expired"
*      }
*     }
*/

/** @apiDefine MissingParameterError
*
* @apiError MissingParameter Missing parameter
*
* @apiErrorExample Error-Response:
*     https/1.1 202
*     {
*     "response": {
*        "status": -4,
*        "description": "Missing parameter"
*      }
*     }
*/

/** @apiDefine MissingRegisterError
*
* @apiError MissingRegister Missing register
*
* @apiErrorExample Error-Response:
*     https/1.1 202
*     {
*     "response": {
*        "status": -1000,
*        "description": "Missing element"
*      }
*     }
*/

/** @apiDefine IdNumericError
*
* @apiError IdNumeric Id numeric error
*
* @apiErrorExample Error-Response:
*     https/1.1 202
*     {
*     "response": {
*        "status": -9,
*        "description": "The id must be numeric"
*      }
*     }
*/

/** @apiDefine TokenHeader
*
* @apiHeader {String} x-access-token JSON Web Token (JWT)
*
* @apiHeaderExample {json} Header-Example:
*     {
*       "x-access-token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE0MzIyMTg2ODc1ODksImlzcyI6InN1bW8iLCJyb2xlIjoiYWRtaW5pc3RyYXRvciJ9._tYZLkBrESt9FwOccyvripIsZR5S0m8PLZmEgIDEFaY"
*     }
*/

/*
 * @api {get} /activity/:vehicleLicense Vehicle activity
 * @apiName GetActivity
 * @apiGroup Vehicle
 * @apiDescription Vehicle activity data
 * @apiVersion 1.0.1
 * @apiSampleRequest https://api.kyroslbs.com/activity/1615-FDW?initDate=1473915536000&endDate=1473915736000
 *
 * @apiParam {String} vehicleLicense Identificador del dispositivo en Kyros
 * @apiParam {Number} initDate Fecha inicial de consulta (epoch)
 * @apiParam {Number} [endDate] Fecha final de consulta (epoch)
 *
 * @apiSuccess {json} activityData Datos de actividad
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *      "datasets": [
 *        {
 *         "type": "line", 
 *         "valueDecimals": 1, 
 *         "data": [0.05556, 0.05556, 0.018520000000000002], 
 *         "name": "Velocidad", "unit": "km/h"
 *        }, 
 *        {
 *         "type": "area", 
 *         "valueDecimals": 0, 
 *         "data": [608.5380249, 608.3743286, 608.6254272], 
 *         "name": "Altitud", "unit": "m"
 *        },
 *        {
 *         "type": "area", 
 *         "valueDecimals": 0, 
 *         "data": [0, 0.007701859186446499, 0.01525227827848508], 
 *         "name": "Distancia", "unit": "m"
 *         }
 *        ],
 *        "xData": [1472725489000, 1472726070000, 1472729044000]
 *     }
 *
 * @apiUse TokenHeader
 * @apiUse PermissionError
 * @apiUse TokenError
 * @apiUse TokenExpiredError
 */
router.get('/activity/:vehicleLicense', function(req, res)
{
    if (req.session.user == null){
      res.redirect('/');
    } 
    else {
      var vehicleLicense = req.params.vehicleLicense;
      var initDate = req.query.initDate;
      var endDate = req.query.endDate;

      log.info("GET: /activity/"+vehicleLicense);

      if (endDate==null) {
        endDate = (new Date).getTime()
      }

      if (initDate==null) {
        res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
      } 
      else {
        var requestData = {
          vehicleLicense : vehicleLicense,
          initDate : initDate,
          endDate : endDate
        };
        ActivityModel.getActivity(requestData, function(error, data)
        {
          if (data == null)
          {
            res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
          }
          else
          {
            //si existe enviamos el json
            if (typeof data !== 'undefined' && data.length > 0)
            {
              res.status(200).json(jsonfy(data))
            }
            else if (typeof data == 'undefined' || data.length == 0)
            {
              res.status(200).json([])
            }
            //en otro caso mostramos un error
            else
            {
              res.status(202).json({"response": {"status":status.STATUS_NOT_FOUND_REGISTER,"description":messages.MISSING_REGISTER}})
            }
          }
        }); 
      }   
    }
});

module.exports = router;