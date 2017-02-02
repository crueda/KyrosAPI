var status = require("../utils/statusCodes.js");
var messages = require("../utils/statusMessages.js");
var express = require('express');
var router = express.Router();
var BeaconModel = require('../models/beacon');

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

/* POST. Obtenemos y mostramos todos los beacons */
/**
 * @api {post} /beacons Request all beacons
 * @apiName GetBeacons
 * @apiGroup Route
 * @apiVersion 1.0.1
 * @apiDescription List of beacons
 * @apiSampleRequest https://api.kyroslbs.com/beacons
 *
 * @apiParam {Number} [startRow] Number of first element
 * @apiParam {Number} [endRow] Number of last element
 * @apiParam {String="id","routeId","description","posBeacon","radius","latitude","longitude"}  [sortBy]     Results sorting by this param. You may indicate various parameters separated by commas. To indicate descending order you can use the - sign before the parameter
 *
 * @apiSuccess {Object[]} beacon       List of beacons
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
 *           "record": [
 *           {
 *             "id": 5513,
 *             "routeId": 768,
 *             "description": "Salida",
 *             "posBeacon": 1,
 *             "radius": 100,
 *             "latitude": 40.264348933803326,
 *             "longitude": -3.3876192569732666
 *          },
 *          {
 *             "id": 5514,
 *             "routeId": 768,
 *             "description": "Baliza: 2",
 *             "posBeacon": 2,
 *             "radius": 100,
 *             "latitude": 40.26421794392092,
 *             "longitude": -3.387898206710815
 *           },
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
router.post('/beacons/', function(req, res)
{
    log.info("POST: /beacons");

    var startRow = req.body.startRow || req.params.startRow || req.query.startRow;
    var endRow = req.body.endRow || req.params.endRow || req.query.endRow;
    var sortBy = req.body.sortBy || req.params.sortBy || req.query.sortBy;
    // Limpiar espacios en blanco
    if (sortBy!=null) {
      sortBy = sortBy.replace(/\s/g, "");
    }

    BeaconModel.getBeacons(startRow, endRow, sortBy, function(error, data, totalRows)
    {
        if (data == null)
        {
          res.status(200).json({"response": {"status":0,"description":"Beacons data","data": {"record": []}}})
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

/* GET. Se obtiene un beacon por su id */
/**
 * @api {get} /beacon/:id Request beacon information
 * @apiName GetBeacon Request beacon information
 * @apiGroup Route
 * @apiVersion 1.0.1
 * @apiDescription Beacon information
 * @apiSampleRequest https://api.kyroslbs.com/beacon
 *
 * @apiParam {Number} id Beacon unique ID
 *
 * @apiSuccess {Number} id Beacon unique ID
 * @apiSuccess {Number} routeId Identification of the route
 * @apiSuccess {Number} posBeacon Position of beacon in the route
 * @apiSuccess {Number} radius Radius of beacon
 * @apiSuccess {Number} longitude Longitude of the vertex (WGS84)
 * @apiSuccess {Number} latitude Latitude of the vertex (WGS84)
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
 *           "record": [
 *           {
 *             "id": 5513,
 *             "routeId": 768,
 *             "description": "Salida",
 *             "posBeacon": 1,
 *             "radius": 100,
 *             "latitude": 40.264348933803326,
 *             "longitude": -3.3876192569732666
 *          }
 *          }]
 *        }
 *       }
 *     }
 *
 * @apiUse TokenHeader
 * @apiUse TokenError
 * @apiUse TokenExpiredError
 * @apiUse MissingRegisterError
 * @apiUse IdNumericError
 */
router.get('/beacon/:id', function(req, res)
{
    var id = req.params.id;
    log.info("GET: /beacon/"+id);

    //se comprueba que la id es un número
    if(!isNaN(id))
    {
        BeaconModel.getBeacon(id,function(error, data)
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


/* PUT. Actualizamos un beacon existente */
/**
 * @api {put} /beacon/ Update beacon
 * @apiName PutNewBeacon
 * @apiGroup Route
 * @apiVersion 1.0.1
 * @apiDescription Update beacon
 * @apiSampleRequest https://api.kyroslbs.com/beacon
 *
 * @apiParam {Number} id Beacon unique ID
 * @apiParam {String} routeId Identification of the route
 * @apiParam {Number} posBeacon Position of beacon in the route
 * @apiParam {Number} radius Radius (in meters) of the beacon
 * @apiParam {Number} longitude Longitude of the vertex (WGS84)
 * @apiParam {Number} latitude Latitude of the vertex (WGS84)
 *
 * @apiSuccess {json} message Result message
 * @apiSuccessExample Success-Response:
 *     https/1.1 200 OK
 *     {
 *       "response" :
 *       {
 *         "status" : 0,
 *         "data": {
 *           "record": [
 *           {
 *             "id": 5513,
 *             "routeId": 768,
 *             "description": "Salida",
 *             "posBeacon": 1,
 *             "radius": 100,
 *             "latitude": 40.264348933803326,
 *             "longitude": -3.3876192569732666
 *          }
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
router.put('/beacon/', function(req, res)
{
    log.info("PUT: /beacon");

    var id_value = req.body.id || req.query.id || req.params.id;
    var description_value = req.body.description || req.query.description || req.params.description;
    var routeId_value = req.body.routeId || req.query.routeId || req.params.routeId;
    var posBeacon_value = req.body.posBeacon || req.query.posBeacon || req.params.posBeacon;
    var radius_value = req.body.radius || req.query.radius || req.params.radius;
    var latitude_value = req.body.latitude || req.query.latitude || req.params.latitude
    var longitude_value = req.body.longitude || req.query.longitude || req.params.longitude;

    log.debug("  -> id:          " + id_value);
    log.debug("  -> description: " + description_value);
    log.debug("  -> routeId:     " + routeId_value);
    log.debug("  -> posBeacon:   " + posBeacon_value);
    log.debug("  -> radius:      " + radius_value);
    log.debug("  -> latitude:    " + latitude_value);
    log.debug("  -> longitude:   " + longitude_value);

    if (id_value == null || description_value == null || routeId_value == null || posBeacon_value == null || radius_value == null || latitude_value == null || longitude_value == null) {
      res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
    }
    else
    {
      //almacenamos los datos en un objeto
      var beaconData = {
          id : id_value,
          routeId : routeId_value,
          description : description_value,
          posBeacon : posBeacon_value,
          radius : radius_value,
          latitude : latitude_value,
          longitude : longitude_value
      };
      BeaconModel.updateBeacon(beaconData,function(error, data)
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
            res.status(200).json({"response": {"status":0,"data": {"record": [beaconData]}}})
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
 * @api {post} /beacon/ Create new beacon
 * @apiName PostNewBeacon
 * @apiGroup Route
 * @apiVersion 1.0.1
 * @apiDescription Create new beacon
 * @apiSampleRequest https://api.kyroslbs.com/beacon
 *
 * @apiParam {Number} routeId Route identification
 * @apiParam {Number} posBeacon Position of beacon in the route
 * @apiParam {Number} radius Radius (in meters) of the beacon
 * @apiParam {String} timestamp Date of the beacon in ISO format
 * @apiParam {Number} latitude Vertex latitude
 * @apiParam {Number} longitude Vertex longitude
 * @apiParamExample {Number} id
 * 5513
 * @apiParamExample {Number} routeId
 * 768
 * @apiParamExample {String} description
 * Salida
 * @apiParamExample {Number} posBeacon
 * 1
 * @apiParamExample {Number} radius
 * 300
 * @apiParamExample {Number} latitude
 * 40.264348933803326
 * @apiParamExample {Number} longitude
 * -3.3876192569732666
 *
 * @apiSuccess {json} message Result message
 * @apiSuccessExample Success-Response:
 *     https/1.1 201 OK
 *     {
 *       "response" :
 *       {
 *         "status" : 0,
 *         "data": {
 *           "record": [
 *           {
 *             "id": 5513,
 *             "routeId": 768,
 *             "description": "Salida",
 *             "posBeacon": 1,
 *             "radius": 100,
 *             "latitude": 40.264348933803326,
 *             "longitude": -3.3876192569732666
 *          }
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
router.post("/beacon", function(req,res)
{
    log.info("POST: /beacon");

    var description_value = req.body.description || req.query.description || req.params.id;
    var routeId_value = req.body.routeId || req.query.routeId || req.params.routeId;
    var posBeacon_value = req.body.posBeacon || req.query.posBeacon || req.params.posBeacon;
    var radius_value = req.body.radius || req.query.radius || req.params.radius;
    var latitude_value = req.body.latitude || req.query.latitude || req.params.latitude;
    var longitude_value = req.body.longitude || req.query.longitude || req.params.longitude;

    log.debug("  -> description: " + description_value);
    log.debug("  -> routeId:     " + routeId_value);
    log.debug("  -> posBeacon:   " + posBeacon_value);
    log.debug("  -> radius:      " + radius_value);
    log.debug("  -> latitude:    " + latitude_value);
    log.debug("  -> longitude:   " + longitude_value);

    if (description_value == null || routeId_value == null || posBeacon_value == null || radius_value == null || latitude_value == null || longitude_value == null) {
      res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
    }
    else
    {
      // Crear un objeto con los datos a insertar del beacon
      var beaconData = {
          id : null,
          routeId : routeId_value,
          description : description_value,
          posBeacon : posBeacon_value,
          radius : radius_value,
          latitude : latitude_value,
          longitude : longitude_value
      };

      BeaconModel.insertBeacon(beaconData,function(error, data)
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
              beaconData.id = data.insertId;
              res.status(201).json({"response": {"status":0,"data": {"record": [beaconData]}}})
          }
          else
          {
             res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
          }
        }
      });
    }
});

/* DELETE. Eliminamos un beacon */
/**
 * @api {delete} /beacon Delete beacon
 * @apiName DeleteBeacon
 * @apiGroup Route
 * @apiVersion 1.0.1
 * @apiDescription Delete beacon
 * @apiSampleRequest https://api.kyroslbs.com/beacon
 *
 * @apiParam {Number} id Beacon unique ID
 *
 * @apiSuccess {json} message Result message
 * @apiSuccessExample Success-Response:
 *     https/1.1 201 OK
 *     {
 *       "response" :
 *       {
 *         "status" : 0,
 *         "data": {
 *           "record": [
 *           {
 *             "id": 5513,
 *             "routeId": 768,
 *             "description": "Salida",
 *             "posBeacon": 1,
 *             "radius": 100,
 *             "latitude": 40.264348933803326,
 *             "longitude": -3.3876192569732666
 *          }
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
router.delete("/beacon/", function(req, res)
{
    log.info("DELETE: /beacon");

    // id del beacon a eliminar
    var id = req.body.id || req.params.id || req.query.id;
    log.debug("  -> id: " + id);

    if (id == null)
    {
      res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
    }
    else
    {
      BeaconModel.deleteBeacon(id,function(error, data)
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
