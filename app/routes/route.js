var status = require("../utils/statusCodes.js");
var messages = require("../utils/statusMessages.js");
var express = require('express');
var router = express.Router();
var RouteModel = require('../models/route');
var moment = require('moment');

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

/* POST. Obtenemos y mostramos todos las rutas */
/**
 * @api {post} /kyrosapi/routes Request all routes
 * @apiName PostRoutes
 * @apiGroup Route
 * @apiVersion 1.0.1
 * @apiDescription List of routes
 * @apiSampleRequest https://api.kyroslbs.com/kyrosapi/routes
 *
 * @apiParam {Number} [startRow] Number of first element
 * @apiParam {Number} [endRow] Number of last element
 * @apiParam {String="id","description","initDate","endDate","typeRoute"}  [sortBy]     Results sorting by this param. You may indicate various parameters separated by commas. To indicate descending order you can use the - sign before the parameter
 *
 * @apiSuccess {Object[]} route       List of routes
 * @apiSuccessExample Success-Response:
 *     https/1.1 200 OK
 *     {
 *       "response" :
 *       {
 *         "status" : 0,
 *         "startRow" : 0,
 *         "endRow" : 2,
 *         "totalRows" : 2,
 *         "data": {
 *            "record": [
 *            {
 *              "id": 744,
 *              "description": "Mad 3 cantos",
 *              "initDate": "2011-11-04T00:00:00Z,
 *              "endDate": 2015-11-04T23:59:59Z,
 *              "typeRoute": 2
 *            },
 *            {
 *              "id": 768,
 *              "description": "Madrid Valencia",
 *              "initDate": "2011-11-04T00:00:00Z,
 *              "endDate": 2015-11-04T23:59:59Z,
 *              "typeRoute": 2
 *            }
 *          }]
 *        }
 *       }
 *     }
 *
 * @apiUse TokenHeader
 * @apiUse PermissionError
 * @apiUse TokenError
 * @apiUse TokenExpiredError
 */
router.post('/routes/', function(req, res)
{
    log.info("POST: /routes");

    var startRow = req.body.startRow || req.params.startRow || req.query.startRow;
    var endRow = req.body.endRow || req.params.endRow || req.query.endRow;
    var sortBy = req.body.sortBy || req.params.sortBy || req.query.sortBy;
    // Limpiar espacios en blanco
    if (sortBy!=null) {
      sortBy = sortBy.replace(/\s/g, "");
    }

    RouteModel.getRoutes(startRow, endRow, sortBy, function(error, data, totalRows)
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


/* GET. Se obtiene una ruta por su id */
/**
 * @api {get} /kyrosapi/route/:id Request route information
 * @apiName GetRoute Request route information
 * @apiGroup Route
 * @apiVersion 1.0.1
 * @apiDescription Route information
 * @apiSampleRequest https://api.kyroslbs.com/kyrosapi/route
 *
 * @apiParam {Number} id Route unique ID
 *
 * @apiSuccess {String} description Description of the vertex
 * @apiSuccess {String} routeType Type of route F=forbidden, A=Allow, G=Generic)
 * @apiSuccess {Number} initDate Init date of route in ISO format
 * @apiSuccess {Number} endDate End date of route in ISO format
 * @apiSuccessExample Success-Response:
 *     https/1.1 200 OK
 *     {
 *       "response" :
 *       {
 *         "status" : 0,
 *         "startRow" : 0,
 *         "endRow" : 1,
 *         "totalRows" : 1,
 *         "data": {
 *            "record": [
 *            {
 *              "id": 744,
 *              "description": "Mad 3 cantos",
 *              "initDate": "2011-11-04T00:00:00Z,
 *              "endDate": 2015-11-04T23:59:59Z,
 *              "typeRoute": 2
 *            }
 *          }]
 *        }
 *       }
 *     }
 * @apiError RouteNotFound The <code>id</code> of the route was not found.
 *
 * @apiUse TokenHeader
 * @apiUse TokenError
 * @apiUse TokenExpiredError
 * @apiUse MissingRegisterError
 * @apiUse IdNumericError
 */
router.get('/route/:id', function(req, res)
{
    var id = req.params.id;
    log.info("GET: /route/"+id);

    //se comprueba que la id es un número
    if(!isNaN(id))
    {
        RouteModel.getRoute(id,function(error, data)
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

  /* PUT. Actualizamos una ruta existente */
  /**
   * @api {put} /kyrosapi/route/ Update route
   * @apiName PutUpdateRoute
   * @apiGroup Route
   * @apiVersion 1.0.1
   * @apiDescription Update route
   * @apiSampleRequest https://api.kyroslbs.com/kyrosapi/route
   *
   * @apiParam {Number} id Route unique ID
   * @apiParam {String} description Description of the vertex
   * @apiParam {String} routeType Type of route F=forbidden, A=Allow, G=Generic)
   * @apiParam {String} initDate Init date of route in ISO format
   * @apiParam {String} endDate End date of route in ISO format
   *
   * @apiSuccess {json} message Result message
   * @apiSuccessExample Success-Response:
   *     https/1.1 200 OK
   *     {
   *       "response" :
   *       {
   *         "status" : 0,
   *         "data": {
   *            "record": [
   *            {
   *              "id": 744,
   *              "description": "Mad 3 cantos",
   *              "initDate": "2011-11-04T00:00:00Z,
   *              "endDate": 2015-11-04T23:59:59Z,
   *              "typeRoute": 2
   *            }
   *          }]
   *        }
   *       }
   *     }
   *
   * @apiUse TokenHeader
   * @apiUse TokenError
   * @apiUse TokenExpiredError
   * @apiUse MissingParameterError
 */
router.put('/route/', function(req, res)
{
    log.info("PUT: /routes");

    var id_value = req.body.id || req.query.id || req.params.id;
    var description_value = req.body.description || req.query.description || req.params.description;
    var routeType_value = req.body.routeType || req.query.routeType || req.params.routeType;
    var initDate_value = req.body.initDate || req.query.initDate || req.params.initDate;
    var endDate_value = req.body.endDate || req.query.endDate || req.params.endDate;

    log.debug("  -> id:          " + id_value);
    log.debug("  -> description: " + description_value);
    log.debug("  -> routeType:   " + routeType_value);
    log.debug("  -> initDate:    " + initDate_value);
    log.debug("  -> endDate:     " + endDate_value);

    if (id_value == null || description_value == null || routeType_value == null || initDate_value == null || endDate_value == null) {
      res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
    }
    else if (!moment(initDate_value,'YYYY-MM-DDTHH:mm:ssZ', true).isValid()) {
      res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.DATE_INCORRECT}})
    }
    else if (!moment(endDate_value,'YYYY-MM-DDTHH:mm:ssZ', true).isValid()) {
      res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.DATE_INCORRECT}})
    }
    else
    {
      //almacenamos los datos del formulario en un objeto
      var routeData = {
          id : id_value,
          description : description_value,
          routeType : routeType_value,
          initDate : initDate_value,
          endDate : endDate_value
      };

      RouteModel.updateRoute(routeData,function(error, data)
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
            res.status(200).json({"response": {"status":0,"data": {"record": [routeData]}}})
          }
          else
          {
            res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
          }
        }
    });
  }
});

/**
 * @api {post} /kyrosapi/route/ Create new route
 * @apiName PostNewRoute
 * @apiGroup Route
 * @apiVersion 1.0.1
 * @apiDescription Create new route
 * @apiSampleRequest https://api.kyroslbs.com/kyrosapi/route
 *
 * @apiParam {String} description Description of the route
 * @apiParam {String} routeType Type of route F=forbidden, A=Allow, G=Generic)
 * @apiParam {String} initDate Init date of rute in ISO format
 * @apiParam {String} endDate End date of rute in ISO format
 *
 * @apiSuccess {json} message Result message
 * @apiSuccessExample Success-Response:
 *     https/1.1 201 OK
 *     {
 *       "response" :
 *       {
 *         "status" : 0,
 *         "data": {
 *            "record": [
 *            {
 *              "id": 744,
 *              "description": "Mad 3 cantos",
 *              "initDate": "2011-11-04T00:00:00Z,
 *              "endDate": 2015-11-04T23:59:59Z,
 *              "typeRoute": 2
 *            }
 *          }]
 *        }
 *       }
 *     }
 *
 * @apiUse TokenHeader
 * @apiUse LoginError
 * @apiUse TokenError
 * @apiUse TokenExpiredError
 * @apiUse MissingParameterError
*/
router.post("/route", function(req,res)
{
    log.info("POST: /route");

    var description_value = req.body.description || req.query.description || req.params.description;
    var routeType_value = req.body.routeType || req.query.routeType || req.params.routeType;
    var initDate_value = req.body.initDate || req.query.initDate || req.params.initDate;
    var endDate_value = req.body.endDate || req.query.endDate || req.params.endDate;

    log.debug("  -> description: " + description_value);
    log.debug("  -> routeType:   " + routeType_value);
    log.debug("  -> initDate:    " + initDate_value);
    log.debug("  -> endDate:     " + endDate_value);

    if (description_value == null || routeType_value == null || initDate_value == null || endDate_value == null) {
      res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
    }
    else if (!moment(initDate_value,'YYYY-MM-DDTHH:mm:ssZ', true).isValid()) {
      res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.DATE_INCORRECT}})
    }
    else if (!moment(endDate_value,'YYYY-MM-DDTHH:mm:ssZ', true).isValid()) {
      res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.DATE_INCORRECT}})
    }
    else
    {
      // Crear un objeto con los datos a insertar de la ruta
      var routeData = {
          id : null,
          description : description_value,
          routeType : routeType_value,
          initDate : initDate_value,
          endDate : endDate_value
      };

      RouteModel.insertRoute(routeData,function(error, data)
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
              routeData.id = data.insertId;
              res.status(201).json({"response": {"status":0,"data": {"record": [routeData]}}})
          }
          else
          {
             res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
          }
        }
      });
    }
});

/* DELETE. Eliminamos una ruta */
/**
 * @api {delete} /kyrosapi/route Delete route
 * @apiName DeleteRoute
 * @apiGroup Route
 * @apiVersion 1.0.1
 * @apiDescription Delete route
 * @apiSampleRequest https://api.kyroslbs.com/kyrosapi/route
 *
 * @apiParam {Number} id Route unique ID
 * @apiSuccess {json} message Result message
 * @apiSuccessExample Success-Response:
 *     https/1.1 200 OK
 *     {
 *       "response" :
 *       {
 *         "status" : 0,
 *         "data": {
 *            "record": [
 *            {
 *              "id": 744,
 *              "description": "Mad 3 cantos",
 *              "initDate": "2011-11-04T00:00:00Z,
 *              "endDate": 2015-11-04T23:59:59Z,
 *              "typeRoute": 2
 *            }
 *          }]
 *        }
 *       }
 *     }
 *
 * @apiUse TokenHeader
 * @apiUse TokenError
 * @apiUse TokenExpiredError
 * @apiUse MissingParameterError
 */
router.delete("/route/", function(req, res)
{
   log.info("DELETE: /route");

    // id de la ruta a eliminar
    var id = req.body.id || req.params.id || req.query.id;
    log.debug("  -> id: " + id);

    if (id == null)
    {
      res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
    }
    else
    {
      RouteModel.deleteRoute(id,function(error, data)
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
