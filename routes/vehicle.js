var status = require("../utils/statusCodes.js");
var messages = require("../utils/statusMessages.js");
var express = require('express');
var router = express.Router();
var VehicleModel = require('../models/vehicle.js');
//var moment = require('moment');

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

/* POST. Obtenemos y mostramos todos los vehiculos */
/**
 * @api {post} /kyrosapi/vehicles Request all vehicles
 * @apiName GetVehicles
 * @apiGroup Vehicle
 * @apiVersion 1.0.1
 * @apiDescription List of vehicles
 * @apiSampleRequest https://api.kyroslbs.com/kyrosapi/vehicles
 *
 * @apiParam {Number} [startRow] Number of first element
 * @apiParam {Number} [endRow] Number of last element
 * @apiParam {String="id","vehicleLicense","alias"}  [sortBy]     Results sorting by this param. You may indicate various parameters separated by commas. To indicate descending order you can use the - sign before the parameter
 *
 * @apiSuccess {Object[]} vehicle       List of vehicles
 *
 * @apiUse TokenHeader
 * @apiUse LoginError
 * @apiUse PermissionError
 * @apiUse TokenError
 * @apiUse TokenExpiredError
 */
router.post('/vehicles/', function(req, res)
{
    log.info("POST: /vehicles");

    var startRow = req.body.startRow || req.params.startRow || req.query.startRow;
    var endRow = req.body.endRow || req.params.endRow || req.query.endRow;
    var sortBy = req.body.sortBy || req.params.sortBy || req.query.sortBy;
    // Limpiar espacios en blanco
    if (sortBy!=null) {
      sortBy = sortBy.replace(/\s/g, "");
    }

    VehicleModel.getVehicles(startRow, endRow, sortBy, function(error, data, totalRows)
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

/* GET. Se obtiene un vehicle por su id */
/**
 * @api {get} /kyrosapi/vehicle/:id Request vehicle information
 * @apiName Getvehicle Request vehicle information
 * @apiGroup vehicle
 * @apiVersion 1.0.1
 * @apiDescription vehicle information
 * @apiSampleRequest https://sumo.kyroslbs.com/kyrosapi/vehicle
 *
 * @apiParam {Number} id vehicle unique ID
 *
 * @apiSuccess {Number} id vehicle unique ID
 * @apiSuccess {String} license License of vehicle
 * @apiSuccess {String} alias Alias of the vehicle
 * @apiSuccess {Number} fleetId Fleet ID
 *
 * @apiSuccessExample Success-Response:
 *     https/1.1 200 OK
 *     {
 *       "response" :
 *       {
 *         "status" : 0,
 *         "startRow" : 0,
 *         "endRow" : 1,
 *         "totalRows" : 1,
 *         "data" : {
 *         "record" : [
 *           {
 *              "id": 123,
 *              "license": 1254-FDS
 *              "alias": "vehicleAlias",
 *              "fleetId": "533",
 *           }]
 *        }
 *       }
 *     }
 *
 * @apiError vehicleNotFound The <code>id</code> of the vehicle was not found.
 *
 * @apiUse TokenHeader
 * @apiUse TokenError
 * @apiUse TokenExpiredError
 * @apiUse IdNumericError
 */
router.get('/vehicle/:id', function(req, res)
{
    var id = req.params.id;
    log.info("GET: /vehicle/"+id);

    //solo actualizamos si la id es un número
    if(!isNaN(id))
    {
        VehicleModel.getVehicle(id,function(error, data)
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


/* PUT. Actualizamos un vehicle existente */
/**
 * @api {put} /kyrosapi/vehicle/ Update vehicle
 * @apiName PutNewvehicle
 * @apiGroup vehicle
 * @apiVersion 1.0.1
 * @apiDescription Update vehicle
 * @apiSampleRequest https://sumo.kyroslbs.com/kyrosapi/vehicle
 *
 * @apiParam {Number} id vehicle unique ID
 * @apiParam {String} alias Alias of the vehicle
 * @apiParam {Number} fleetId Fleet ID of the vehicle
 *
 * @apiSuccess {String} message Result message
 *
 * @apiSuccessExample Success-Response:
 *     https/1.1 200 OK
 *     {
 *       "response" :
 *       {
 *         "status" : 0,
 *         "data" : {
 *         "record" : [
 *           {
 *              "id": 123,
 *              "alias": "vehicleAlias",
 *              "fleetId": "432",
 *           }]
 *        }
 *       }
 *     }
 *
 * @apiUse TokenHeader
 * @apiUse TokenError
 * @apiUse TokenExpiredError
 * @apiUse MissingParameterError
 */
router.put('/vehicle/', function(req, res)
{
    log.info("PUT: /vehicle");

    var id_value = req.body.id || req.query.id || req.params.id;
    var alias_value = req.body.alias || req.query.alias || req.params.alias;
    var fleetId_value = req.body.fleetId || req.query.fleetId || req.params.fleetId;

    log.debug("  -> id:            " + id_value);
    log.debug("  -> alias:         " + alias_value);
    log.debug("  -> fleetId:       " + fleetId_value);

    if (id_value == null || alias_value == null || fleetId_value == null) {
      res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
    }
    else
    {
      //almacenamos los datos del formulario en un objeto
      var vehicleData = {
          id : id_value,
          alias : alias_value,
          fleetId : fleetId_value
      };
      VehicleModel.updateVehicle(vehicleData,function(error, data)
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
              res.status(200).json({"response": {"status":0,"data": {"record": [vehicleData]}}})
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
 * @api {post} /kyrosapi/vehicle/ Create new vehicle
 * @apiName PostNewvehicle
 * @apiGroup vehicle
 * @apiVersion 1.0.1
 * @apiDescription Create new vehicle
 * @apiSampleRequest https://api.kyroslbs.com/kyrosapi/vehicle
 *
 * @apiParam {String} license License of the vehicle
 * @apiParam {Number} imei IMEI of the vehicle
 * @apiParam {String} alias Alias of the vehicle (if alias is null, name value will be used as alias)
 * @apiParam {Number} fleetId Fleet ID of the vehicle
 *
 * @apiSuccess {json} message Result message
 *
 * @apiSuccessExample Success-Response:
 *     https/1.1 201 OK
 *     {
 *       "response" :
 *       {
 *         "status" : 0,
 *         "data" : {
 *         "record" : [
 *           {
 *              "id": 123,
 *              "license": "1243-FSD",
 *              "alias": "vehicleAlias",
 *              "fleetId": "45",
 *           }]
 *        }
 *       }
 *     }
 *
 * @apiUse TokenHeader
 * @apiUse TokenError
 * @apiUse TokenExpiredError
 * @apiUse MissingParameterError
*/
router.post("/vehicle", function(req,res)
{
    log.info("POST: /vehicle");

    var license_value = req.body.license || req.query.license || req.params.license;
    var imei_value = req.body.imei || req.query.imei || req.params.imei;
    var alias_value = req.body.alias || req.query.alias || req.params.alias;
    var fleetId_value = req.body.fleetId || req.query.fleetId || req.params.fleetId;

    log.debug("  -> license:       " + license_value);
    log.debug("  -> imei:          " + imei_value);
    log.debug("  -> alias:         " + alias_value);
    log.debug("  -> fleetId:       " + fleetId_value);

    if (license_value == null || imei_value == null || alias_value == null || fleetId_value == null) {
      res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
    }
    else
    {
      // Crear un objeto con los datos a insertar del vehicle
      var vehicleData = {
          id : null,
          license : license_value,
          imei : imei_value,
          alias : alias_value,
          fleetId : fleetId_value
      };

      VehicleModel.insertVehicle(vehicleData,function(error, data)
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
              vehicleData.id = data.insertId;

              res.status(201).json({"response": {"status":0,"data": {"record": [vehicleData]}}})
          }
          else
          {
             res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
          }
        }
      });
    }
});

/* DELETE. Eliminar un vehicle */
/**
 * @api {delete} /kyrosapi/vehicle Delete vehicle
 * @apiName Deletevehicle
 * @apiGroup vehicle
 * @apiVersion 1.0.1
 * @apiDescription Delete vehicle
 * @apiSampleRequest https://api.kyroslbs.com/kyrosapi/vehicle
 *
 * @apiParam {Number} id vehicle unique ID
 *
 * @apiSuccess {json} message Result message
 * @apiSuccessExample Success-Response:
 *     https/1.1 200 OK
 *     {
 *       "response" :
 *       {
 *         "status" : 0,
 *         "data" : {
 *         "record" : [
 *           {
 *             "id": 123,
 *              "license": "2319-DSS",
 *              "alias": "vehicleAlias",
 *              "fleetId": "34"
 *           }]
 *        }
 *       }
 *     }
 *
 * @apiUse TokenHeader
 * @apiUse TokenError
 * @apiUse TokenExpiredError
 * @apiUse MissingParameterError
 */
router.delete("/vehicle/", function(req, res)
{
     log.info("DELETE: /vehicle");

      // id del vehicle a eliminar
      var id = req.body.id || req.params.id || req.query.id;
      log.debug("  -> id: " + id);

      if (id == null)
      {
        res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
      }
      else
      {
        VehicleModel.deleteVehicle(id,function(error, data)
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
