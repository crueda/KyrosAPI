var status = require("../utils/statusCodes.js");
var messages = require("../utils/statusMessages.js");
var express = require('express');
var router = express.Router();
var AreaModel = require('../models/area');
var moment = require('moment');

// Fichero de propiedades
var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('kyrosapi.properties');

// Definición del log
var fs = require('fs');
var log = require('tracer').console({
    transport : function(data) {
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

function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

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

/* POST. Obtenemos y mostramos todos las areas */
/**
 * @api {post} /areas Request all areas
 * @apiName PostAreas
 * @apiGroup Area
 * @apiVersion 1.0.2
 * @apiDescription List all areas
 * @apiSampleRequest https://api.kyroslbs.com/areas
 *
 * @apiParam {Number} [startRow]     Initial pagination index
 * @apiParam {Number} [endRow]       End pagination index
 * @apiParam {String="id","description","initDate","endDate","initHour","endHour","typeArea","radius"}  [sortBy]     Results sorting by this param. You may indicate various parameters separated by commas. To indicate descending order you can use the - sign before the parameter
 *
 * @apiSuccess {json} areas       List of areas
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *        "response" :
 *        {
 *            "status" : 0,
 *            "startRow" : 0,
 *            "endRow" : 1,
 *            "totalRows" : 2,
 *            "data" :
 *            {
 *              "record" :
 *              [ {
 *                 "id": 895,
 *                 "description": "Zona 1",
 *                 "initDate": "2015-04-01",
 *                 "endDate": "2015-09-12",
 *                 "initHour": 0945,
 *                 "endHour": 1030,
 *                 "typeArea": "F",
 *                 "radius": null,
 *                 "username": "vimsve"
 *                },
 *                {
 *                 "id": 896,
 *                 "description": "Zona 2",
 *                 "initDate": "2015-04-01T00:00:00.00Z",
 *                 "endDate": "2015-09-12T00:00:00.00Z",
 *                 "typeArea": "F",
 *                 "radius": 12,
 *                 "username": "vimsve"
 *                }]
 *            }
 *         }
 *     }
 *
 * @apiUse TokenHeader
 * @apiUse PermissionError
 * @apiUse TokenError
 * @apiUse TokenExpiredError
*/
router.post('/areas/', function(req, res)
{
    log.info("POST: /areas");

    AreaModel.getAreas(function(error, data)
    {
        if (data == null)
        {
          res.status(200).json({"response": {"status": 0, "count": 0, "data":  []}})
        }
        else if (data !== 'undefined')
        {
          res.status(200).json({"response": {"status": 0, "count": data.length, "data": data}})
        }
        //en otro caso se muestra error
        else
        {
            res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
        }
    });
});

/* GET. Obtenemos un area por su id */
/**
 * @api {get} /area/:id Request area information
 * @apiName GetArea Request area information
 * @apiGroup Area
 * @apiVersion 1.0.2
 * @apiDescription Get area information
 * @apiSampleRequest https://api.kyroslbs.com/area
 *
 * @apiParam {Number} id Area unique ID
 *
 * @apiSuccess {String} description Description of the Area
 * @apiSuccess {String} dateInit Init date for the area in ISO format
 * @apiSuccess {String} dateEnd End date for the area in ISO format
 * @apiSuccess {String} hourInit Init hour for the area (hour-minutes)
 * @apiSuccess {String} hourEnd End hour for the area (hour-minutes)
 * @apiSuccess {String} typeArea Type of area (A=Allow, F=Forbidden, G=Generic)
 * @apiSuccess {Number} radius Radius of area (in meters)
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *        "response" :
 *        {
 *            "status" : 0,
 *            "count" : 1,
 *            "data" :
 *              [ {
 *                 "id": 895,
 *                 "description": "Zona 1",
 *                 "initDate": "2015-04-01T00:00:00Z",
 *                 "endDate": "2015-09-12T00:00:00Z",
 *                 "typeArea": "F",
 *                 "radius": 0,
 *                 "username": "vimsve"
 *                }
 *              ]
 *            }
 *         }
 *     }
 *
 * @apiError AreaNotFound The <code>id</code> of the Area was not found.
 *
 * @apiUse TokenHeader
 * @apiUse LoginError
 * @apiUse TokenError
 * @apiUse TokenExpiredError
 * @apiUse MissingRegisterError
 * @apiUse IdNumericError
 */
router.get('/area/:id', function(req, res)
{
    var id = req.params.id;

    log.info("GET: /area/"+id);
    access_log.info("PARAMS >>> " + "id: " + id);

    //se comprueba que la id es un número
    if(!isNaN(id))
    {
        AreaModel.getArea(id,function(error, data)
        {
          if (data == null)
          {
            res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
          }
          else
          {
            //si existe enviamos el json
            if (data !== 'undefined' && data.length > 0)
            {
                res.status(200).json({"response": {"status":0,"count":1,"data": [data]}})
            }
            //en otro caso mostramos un error
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
