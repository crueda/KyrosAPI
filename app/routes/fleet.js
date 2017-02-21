var status = require("../utils/statusCodes.js");
var messages = require("../utils/statusMessages.js");
var express = require('express');
var router = express.Router();
var fleetModel = require('../models/fleet');
var utils = require("../utils/utils.js");

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
var access_log = require('tracer').console({
  format : "              {{message}}",
    transport : function(data) {
        fs.open(properties.get('main.access_log.file'), 'a', 0666, function(e, id) {
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

/**
 * @api {post} /fleets Request all fleets
 * @apiName GetFleets
 * @apiGroup Fleet
 * @apiVersion 1.0.2
 * @apiDescription List of fleets
 * @apiSampleRequest https://api.kyroslbs.com/fleets
 *
 * @apiSuccess {Object[]} fleet       List of fleets
 * @apiSuccessExample Success-Response:
 *     https/1.1 200 OK
 *     {
 *       "response" :
 *       {
 *         "status" : 0,
 *         "count" : 2,
 *         "data" : [
 *           {
 *              "id": 123,
 *              "name": "Flota1"
 *           },
 *           {
 *              "id": 124,
 *              "name": "Flota2"
 *           }]
 *       }
 *     }
 *
 * @apiUse TokenHeader
 * @apiUse PermissionError
 * @apiUse TokenError
 * @apiUse TokenExpiredError
 */
router.post('/fleets/', function(req, res)
{
    log.info("POST: /fleets");

    var username = utils.getUsernameFromToken(req);
    fleetModel.getFleets(username, function(error, data)
    {
        if (data == null)
        {
          res.status(200).json({"response": {"status":0,"count":0, "data": []}})
        }
        else if (typeof data !== 'undefined')
        {
          res.status(200).json({"response": {"status":0, "count": data.length, "data": data}})
        }
        else
        {
            res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
        }
    });
});

/**
 * @api {get} /fleet/:id Request fleet information
 * @apiName GetFleet
 * @apiGroup Fleet
 * @apiVersion 1.0.2
 * @apiDescription Fleet information
 * @apiSampleRequest https://api.kyroslbs.com/fleet
 *
 * @apiParam {Number} id fleet unique ID
 *
 * @apiSuccess {Number} id fleet unique ID
 * @apiSuccess {String} name Name of the fleet
 * @apiSuccess {String} description Description of the fleet
 * @apiSuccess {Number} companyId company ID
 *
 * @apiSuccessExample Success-Response:
 *     https/1.1 200 OK
 *     {
 *       "response" :
 *       {
 *         "status" : 0,
 *         "count" : 1,
 *         "data" : [
 *           {
 *              "id": 123,
 *              "name": "Flota1"
 *           }]
 *       }
 *     }
 *
 * @apiError fleetNotFound The <code>id</code> of the fleet was not found.
 *
 * @apiUse TokenHeader
 * @apiUse LoginError
 * @apiUse TokenError
 * @apiUse TokenExpiredError
 * @apiUse MissingRegisterError
 * @apiUse IdNumericError
 */
router.get('/fleet/:id', function(req, res)
{
    var id = req.params.id;
    log.info("GET: /fleet/"+id);

    //se comprueba que el id es un número
    if(!isNaN(id))
    {
        fleetModel.getFleet(id,function(error, data)
        {
          if (data == null)
          {
            res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
          }
          else
          {
            //si existe se envia el json
            if (typeof data !== 'undefined' && data.length > 0)
            {
                res.status(200).json({"response": {"status":0, "count":1, "data": data}});
            }
            //en otro caso se muestra un error
            else
            {
                res.status(202).json({"response": {"status":status.STATUS_NOT_FOUND_REGISTER,"description":messages.MISSING_REGISTER}})
            }
          }
        });
    }
    //si la id no es numerica mostramos un error de servidor
    else
    {
        res.status(202).json({"response": {"status":status.STATUS_UPDATE_WITHOUT_PK_ERROR,"description":messages.ID_NUMERIC_ERROR}})
    }
});

module.exports = router;
