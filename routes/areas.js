var status = require("../utils/statusCodes.js");
var messages = require("../utils/statusMessages.js");
var express = require('express');
var router = express.Router();
var AreaModel = require('../models/area');
var moment = require('moment');

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
 * @api {post} /kyrosapi/areas Request all areas
 * @apiName PostAreas
 * @apiGroup Area
 * @apiVersion 1.0.1
 * @apiDescription List all areas
 * @apiSampleRequest https://api.kyroslbs.com/kyrosapi/areas
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
 *                 "initDate": "2015-04-01T",
 *                 "endDate": "2015-09-12T",
 *                 "initHour": 0945,
 *                 "endHour": 1030,
 *                 "typeArea": "F",
 *                 "radius": null,
 *                 "username": "vimsve"
 *                },
 *                {
 *                 "id": 896,
 *                 "description": "Zona 2",
 *                 "initDate": "2015-04-01T",
 *                 "endDate": "2015-09-12T",
 *                 "initHour": 0945,
 *                 "endHour": 1030,
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

    var startRow = req.body.startRow || req.params.startRow || req.query.startRow;
    var endRow = req.body.endRow || req.params.endRow || req.query.endRow;
    var sortBy = req.body.sortBy || req.params.sortBy || req.query.sortBy;
    // Limpiar espacios en blanco
    if (sortBy!=null) {
      sortBy = sortBy.replace(/\s/g, "");
    }

    AreaModel.getAreas(startRow, endRow, sortBy, function(error, data, totalRows)
    {
        if (data == null)
        {
          res.status(200).json({"response": {"status":0,"data": {"record": []}}})
        }
        else if (typeof data !== 'undefined')
        {
          if (startRow == null || endRow == null) {
            startRow = 0;
            endRow = totalRows;
          }
          res.status(200).json({"response": {"status":0,"totalRows":totalRows,"startRow":parseInt(startRow),"endRow":parseInt(endRow),"status":0,"data": { "record": data}}})
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
 * @api {get} /kyrosapi/area/:id Request area information
 * @apiName GetArea Request area information
 * @apiGroup Area
 * @apiVersion 1.0.1
 * @apiDescription Get SUMO area information
 * @apiSampleRequest https://sumo.kyroslbs.com/kyrosapi/area
 *
 * @apiParam {Number} id Area unique ID
 *
 * @apiSuccess {String} description Description of the Area
 * @apiSuccess {Number} dateInit Init date for the area in ISO format
 * @apiSuccess {Number} dateEnd End date for the area in ISO format
 * @apiSuccess {Number} hourInit Init hour for the area in ISO formal
 * @apiSuccess {Number} hourEnd End hour for the area in ISO format
 * @apiSuccess {String} typeArea Type of area (A=Allow, F=Forbidden, G=Generic)
 * @apiSuccess {Number} radius Radius of area (in meters)
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *        "response" :
 *        {
 *            "status" : 0,
 *            "startRow" : 0,
 *            "endRow" : 1,
 *            "totalRows" : 1,
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
            if (typeof data !== 'undefined' && data.length > 0)
            {
                res.status(200).json({"response": {"status":0,"totalRows":1,"startRow":0,"endRow":1,"data": {"record": [data]}}})
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

/* Creamos un nuevo area */
/**
 * @api {post} /kyrosapi/area/ Create new area
 * @apiName PostNewArea
 * @apiGroup Area
 * @apiVersion 1.0.1
 * @apiDescription Create new area
 * @apiSampleRequest https://sumo.kyroslbs.com/kyrosapi/area
 *
 * @apiParam {String} description Description of the Area
 * @apiParam {String} dateInit Init date for the area in ISO format
 * @apiParam {String} dateEnd End date for the area in ISO format
 * @apiParam {String} hourInit Init hour for the area in ISO format
 * @apiParam {String} hourEnd End hour for the area in ISO format
 * @apiParam {String} typeArea Type of area (A=Allow, F=Forbidden, G=Generic)
 * @apiParam {Number} [radius=0] Radius of area (in meters)
 * @apiParamExample {String} dateInit
 * 2014-11-07
 * @apiParamExample {String} dateEnd
 * 2014-11-08
 * @apiParamExample {String} hourInit
 * 16:03:00
 * @apiParamExample {String} hourEnd
 * 19:22:00
 * @apiParamExample {String} typeArea
 * A
 * @apiParamExample {Number} radius
 * 100
 *
 * @apiSuccess {json} message Result message
 * @apiSuccessExample Success-Response:
 *     https/1.1 201 OK
 *     {
 *        "response" :
 *        {
 *            "status" : 0,
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
 *                }
 *              ]
 *            }
 *         }
 *     }
 *
 * @apiUse TokenHeader
 * @apiUse LoginError
 * @apiUse TokenError
 * @apiUse TokenExpiredError
 * @apiUse MissingParameterError
 */
router.post("/area", function(req,res)
{
    log.info("POST: /area");

    //creamos un objeto con los datos a insertar del area
    var description_value = req.body.description || req.query.description || req.params.description;
    var initDate_value = req.body.initDate || req.query.initDate || req.params.initDate;
    var endDate_value = req.body.endDate || req.query.endDate || req.params.endDate;
    var initHour_value = req.body.initHour || req.query.initHour || req.paramsinitHour;
    var endHour_value = req.body.endHour || req.query.endHour || req.params.endHour;
    var typeArea_value = req.body.typeArea || req.query.typeArea || req.params.typeArea;
    var radius_value = req.body.radius || req.query.radius || req.params.radius;

    log.debug("  -> description:  " + description_value);
    log.debug("  -> initDate:     " + initDate_value);
    log.debug("  -> endDate:      " + endDate_value);
    log.debug("  -> initHour:     " + initHour_value);
    log.debug("  -> endHour:      " + endHour_value);
    log.debug("  -> typeArea:     " + typeArea_value);
    log.debug("  -> radius:       " + radius_value);

    if (radius_value == null)
      radius_value = 0;

    if (description_value == null || initDate_value == null || endDate_value == null || initHour_value == null || endHour_value == null || typeArea_value == null) {
      res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
    }
    else if (!moment(initDate_value,'YYYY-MM-DD', true).isValid()) {
      res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.DATE_INCORRECT}})
    }
    else if (!moment(endDate_value,'YYYY-MM-DD', true).isValid()) {
      res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.DATE_INCORRECT}})
    }
    else if (!moment(initHour_value,'HH:mm:ss', true).isValid()) {
      res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.DATE_INCORRECT}})
    }
    else if (!moment(endHour_value,'HH:mm:ss', true).isValid()) {
      res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.DATE_INCORRECT}})
    }
    else
    {
      // ajustar las horas
      initHour_value2 = initHour_value.charAt(0) + initHour_value.charAt(1) + initHour_value.charAt(3) + initHour_value.charAt(4);
      endHour_value2 = endHour_value.charAt(0) + endHour_value.charAt(1) + endHour_value.charAt(3) + endHour_value.charAt(4);
      var areaData = {
          id : null,
          description : description_value,
          initDate : initDate_value,
          endDate : endDate_value,
          initHour : initHour_value2,
          endHour : endHour_value2,
          typeArea : typeArea_value,
          radius : radius_value,
          username : 'sumoAPI'
      };
      AreaModel.insertArea(areaData,function(error, data)
      {
        if (data == null)
        {
          res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
        }
        else
        {
          // si se ha insertado correctamente mostramos su messaje de exito
          if(data && data.insertId)
          {
              areaData.id = data.insertId;
              res.status(201).json({"response": {"status":0,"data": {"record": [areaData]}}})
          }
          else
          {
             res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
          }
        }
      });
    }
});

/* PUT. Actualizamos un area existente */
/**
 * @api {put} /kyrosapi/area/ Update area
 * @apiName PutNewArea
 * @apiGroup Area
 * @apiVersion 1.0.1
 * @apiDescription Areas of SUMO
 * @apiSampleRequest https://sumo.kyroslbs.com/kyrosapi/area
 *
 * @apiParam {Number} id Area unique ID
 * @apiParam {String} description Description of the Area
 * @apiParam {Number} dateInit Init date for the area in ISO format
 * @apiParam {Number} dateEnd End date for the area in ISO format
 * @apiParam {Number} hourInit Init hour for the area
 * @apiParam {Number} hourEnd End hour for the area
 * @apiParam {String} typeArea Type of area (A=Allow, F=Forbidden, G=Generic)
 * @apiParam {Number} radius Radius of area (in meters)
 *
 * @apiSuccess {json} message Result message
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *        "response" :
 *        {
 *            "status" : 0,
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
 *                }
 *              ]
 *            }
 *         }
 *     }
 *
 * @apiUse TokenHeader
 * @apiUse LoginError
 * @apiUse TokenError
 * @apiUse TokenExpiredError
 * @apiUse MissingParameterError
 */
router.put('/area/', function(req, res)
{
    log.info("PUT: /area");

    //almacenamos los datos del formulario en un objeto
    var id_value = req.body.id || req.query.id || req.params.id;
    var description_value = req.body.description || req.query.description || req.params.description;
    var initDate_value = req.body.initDate || req.query.initDate || req.params.initDate;
    var endDate_value = req.body.endDate || req.query.endDate || req.params.endDate;
    var initHour_value = req.body.initHour || req.query.initHour || req.paramsinitHour;
    var endHour_value = req.body.endHour || req.query.endHour || req.params.endHour;
    var typeArea_value = req.body.typeArea || req.query.typeArea || req.params.typeArea;
    var radius_value = req.body.radius || req.query.radius || req.params.radius;

    log.debug("  -> id:           " + id_value);
    log.debug("  -> description:  " + description_value);
    log.debug("  -> initDate:     " + initDate_value);
    log.debug("  -> endDate:      " + endDate_value);
    log.debug("  -> initHour:     " + initHour_value);
    log.debug("  -> endHour:      " + endHour_value);
    log.debug("  -> typeArea:     " + typeArea_value);
    log.debug("  -> radius:       " + radius_value);

    if (id_value == null || description_value == null || initDate_value == null || endDate_value == null || initHour_value == null || endHour_value == null || typeArea_value == null || radius_value == null ) {
      res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
    }
    else
    {
      var areaData = {
          id : id_value,
          description : description_value,
          initDate : initDate_value,
          endDate : endDate_value,
          initHour : initHour_value,
          endHour : endHour_value,
          typeArea : typeArea_value,
          radius : radius_value,
          username : 'sumoAPI'
      };

      AreaModel.updateArea(areaData,function(error, data)
      {
        if (data == null)
        {
          res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
        }
        else
        {
          //si se ha actualizado correctamente mostramos un mensaje
          if(data && data.message)
          {
            res.status(200).json({"response": {"status":0,"data": {"record": [areaData]}}})
          }
          else
          {
            res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
          }
        }
    });
  }
});

/* DELETE. Eliminamos un area */
/**
 * @api {delete} /kyrosapi/area Delete area
 * @apiName DeleteArea
 * @apiGroup Area
 * @apiVersion 1.0.1
 * @apiDescription Delete area
 * @apiSampleRequest https://sumo.kyroslbs.com/kyrosapi/area
 *
 * @apiParam {Number} id Area unique ID
 *
 * @apiSuccess {json} message Result message
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *        "response" :
 *        {
 *            "status" : 0,
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
 *                }
 *              ]
 *            }
 *         }
 *     }
 *
 * @apiUse TokenHeader
 * @apiUse LoginError
 * @apiUse TokenError
 * @apiUse TokenExpiredError
 * @apiUse MissingParameterError
 */
router.delete("/area/", function(req, res)
{
    log.info("DELETE: /area");

    //id del area a eliminar
    var id = req.body.id || req.params.id || req.query.id;
    log.debug("  -> id: " + id);

    if (id == null)
    {
      res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
    }
    else
    {
      AreaModel.deleteArea(id,function(error, data)
      {
            if (data == null)
            {
              res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
            }
            else
            {
              if(data && data.message != "notExist")
              {
                res.status(200).json({"response": {"status":0,"data": {"record": data}}})
              }
              else
              {
                res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
              }
            }
        });
      }
  });

module.exports = router;
