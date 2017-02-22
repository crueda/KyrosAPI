var status = require("../utils/statusCodes.js");
var messages = require("../utils/statusMessages.js");
var express = require('express');
var router = express.Router();
var PoiModel = require('../models/poi');
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
 * @api {post} /pois Request all POIs
 * @apiName GetPois
 * @apiGroup POI
 * @apiVersion 1.0.1
 * @apiDescription List of POIs
 * @apiSampleRequest https://api.kyroslbs.com/pois
 *
 * @apiSuccess {Object[]} poi       List of POIs
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
 *              "description": "Gasolinera",
 *              "latitude": 40.121323,
 *              "longitude": "1.4667878"
 *           },
 *           {
 *              "id": 124,
 *              "description": "Compañia",
 *              "latitude": 39.121323,
 *              "longitude": "4.4667878"
 *           }]
 *        }
 *     }
 *
 * @apiUse TokenHeader
 * @apiUse PermissionError
 * @apiUse TokenError
 * @apiUse TokenExpiredError
 */
router.post('/pois/', function(req, res)
{
    log.info("POST: /pois");

    var username = utils.getUsernameFromToken(req);
    PoiModel.getPois(username, function(error, data)
    {
        if (data == null)
        {
          res.status(200).json({"response": {"status":0,"count": 0, "data": []}})
        }
        else if (typeof data !== 'undefined')
        {
          res.status(200).json({"response": {"status":0,"count":data.length,"data": data}})
        }
        //en otro caso se muestra un error
        else
        {
            res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
        }
    });
});

/**
 * @api {get} /poi/:id Request POI information
 * @apiName GetPoi
 * @apiGroup POI
 * @apiVersion 1.0.1
 * @apiDescription POI information
 * @apiSampleRequest https://api.kyroslbs.com/poi
 *
 * @apiParam {Number} id POI unique ID
 *
 * @apiSuccess {Number} id POI unique ID
 * @apiSuccess {String} description Description of POI
 * @apiSuccess {Number} longitude Longitude of the POI (WGS84)
 * @apiSuccess {Number} latitude Latitude of the POI (WGS84)
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
 *              "description": "Centro comercial",
 *              "latitude": 40.121323,
 *              "longitude": "1.4667878"
 *           }]
 *        }
 *     }
 *
 * @apiError PoiNotFound The <code>id</code> of the poi was not found.
 *
 * @apiUse TokenHeader
 * @apiUse LoginError
 * @apiUse TokenError
 * @apiUse TokenExpiredError
 * @apiUse MissingRegisterError
 * @apiUse IdNumericError
 */
router.get('/poi/:id', function(req, res)
{
    var id = req.params.id;
    log.info("GET: /poi/"+id);

    //se comprueba que la id es un número
    if(!isNaN(id))
    {
        var username = utils.getUsernameFromToken(req);
        PoiModel.getPoi(username,id,function(error, data)
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
                res.status(200).json({"response": {"status":0,"count":1,"data": data}})
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
