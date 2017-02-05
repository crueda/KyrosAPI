var status = require("../utils/statusCodes.js");
var messages = require("../utils/statusMessages.js");
var express = require('express');
var router = express.Router();
var VehicleModel = require('../models/vehicle');
var moment = require('moment');
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
 * @api {post} /vehicles Request all vehicles
 * @apiName GetVehicles
 * @apiGroup Vehicle
 * @apiVersion 1.0.1
 * @apiDescription List of vehicles
 * @apiSampleRequest https://api.kyroslbs.com/vehicles
 *
 * @apiParam {Number} [startRow] Number of first element
 * @apiParam {Number} [endRow] Number of last element
 * @apiParam {String} [sortBy] Sort order on elements (comma separated)
 * @apiParam {String="id","license","alias","bastidor"}  [sortBy]     Results sorting by this param. You may indicate various parameters separated by commas. To indicate descending order you can use the - sign before the parameter
 *
 * @apiSuccess {Object[]} vehicle       List of vehicles
 *
 * @apiUse TokenHeader
 * @apiUse PermissionError
 * @apiUse TokenError
 * @apiUse TokenExpiredError
 */
router.post('/vehicles/', function(req, res)
{
    log.info("POST: /vehicles"); 

    var startRow = req.body.startRow;
    var endRow = req.body.endRow;
    var sortBy = req.body.sortBy;
    // Limpiar espacios en blanco
    if (sortBy!=null) {
      sortBy = sortBy.replace(/\s/g, "");
    }

    var username = utils.getUsernameFromToken(req);
    VehicleModel.getVehicles(startRow, endRow, sortBy, username, function(error, data, totalRows)
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
          else if (totalRows -1 <= endRow) {
            endRow = totalRows - 1;
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

/**
 * @api {get} /vehicle/:id Request vehicle information
 * @apiName GetVehicle Request vehicle information
 * @apiGroup Vehicle
 * @apiVersion 1.0.1
 * @apiDescription Vehicle information
 * @apiSampleRequest https://api.kyroslbs.com/vehicle
 *
 * @apiParam {Number} id Vehicle unique ID
 *
 * @apiSuccess {Number} id Vehicle unique ID
 * @apiSuccess {String} license License of the vehicle
 * @apiSuccess {String} alias Alias of the vehicle
 * @apiSuccess {String} creationTime Creation time of vehicle in ISO format
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
 *              "creationTime": "2011-11-04T00:00:00Z,
 *              "license": "1387-FWD",
 *              "alias": "Coche de reparto",
 *              "creationTime": "2011-11-04T00:00:00.00Z",
 *           }]
 *        }
 *       }
 *     }
 *
 * @apiError VehicleNotFound The <code>id</code> of the vehicle was not found.
 *
 * @apiUse TokenHeader
 * @apiUse TokenError
 * @apiUse TokenExpiredError
 * @apiUse MissingRegisterError
 * @apiUse IdNumericError
 */
router.get('/vehicle/:id', function(req, res)
{
    var id = req.params.id;
    log.info("GET: /vehicle/"+id);

    //solo actualizamos si la id es un número
    if(!isNaN(id))
    {
        VehileModel.getVehicle(id,function(error, data)
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
                res.status(200).json({"response": {"status":0,"totalRows":1,"startRow":0,"endRow":1,"data": {"record": data}}})
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


/*
 * @api {put} /vehicle/ Update vehicle
 * @apiName PutNewVehicle
 * @apiGroup Vehicle
 * @apiVersion 1.0.1
 * @apiDescription Update vehicle
 * @apiSampleRequest https://api.kyroslbs.com/vehicle
 *
 * @apiParam {Number} id Vehicle unique ID
 * @apiSuccess {String} license License of the vehicle
 * @apiParam {String} alias Alias of the vehicle
 * @apiSuccess {String} creationTime Creation time of vehicle in ISO format
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
 *              "creationTime": "2011-11-04T00:00:00Z,
 *              "license": "1274-GDS",
 *              "alias": "Coche auxiliar",
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
/*
router.put('/vehicle/', function(req, res)
{
    log.info("PUT: /vehicle");

    var id_value = req.body.id;
    var license_value = req.body.authorized;
    var alias_value = req.body.alias;
    var creationTime_value = req.body.creationTime;

    log.debug("  -> id_value:        " + id_value);
    log.debug("  -> lilcense:        " + license_value);
    log.debug("  -> alias:           " + alias_value);
    log.debug("  -> creationTime:    " + creationTime_value);

    if (id_value == null || alias_value == null || license_value == null  || creationTime_value == null) {
      res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
    }
    else if (!moment(creationTime_value,'YYYY-MM-DDTHH:mm:ss.SSZ', true).isValid()) {
      res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.DATE_INCORRECT}})
    }
    else
    {
      var vehicleData = {
          id : id_value,
          license : license_value,
          alias : alias_value,
          creationTime : creationTime_value
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
*/
/*
 * @api {post} /vehicle/ Create new vehicle
 * @apiName PostNewVehicle
 * @apiGroup Vehicle
 * @apiVersion 1.0.1
 * @apiDescription Create new vehicle
 * @apiSampleRequest https://api.kyroslbs.com/vehicle
 *
 * @apiParam {String} license Unique license name of the vehicle
 * @apiParam {String} [alias] Alias of the vehicle (if alias is null, license value will be used as alias)
 * @apiParam {Number} fleetId Identification of the fleet
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
 *              "creationTime": "2016-11-04T00:00:00Z,
 *              "license": "5423-HJT",
 *              "alias": "Vehiculo nuevo",
 *              "fleetId": 34
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
/*
router.post("/vehicle", function(req,res)
{
    log.info("POST: /vehicle");

    var license_value = req.body.license;
    var alias_value = req.body.alias;
    var fleetId_value = req.body.fleetId;

    log.debug("  -> license:    " + license_value);
    log.debug("  -> alias:      " + alias_value);
    log.debug("  -> fleetId:    " + fleetId_value);

    if (license_value == null || fleetId_value == null) {
      res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
    }
    else
    {
      if (alias_value == null) {
        alias_value = license_value;
      }

      var vehicleData = {
          id : null,
          license : license_value,
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
*/
/*
 * @api {delete} /vehicle Delete vehicle
 * @apiName DeleteVwehicle
 * @apiGroup Vehicle
 * @apiVersion 1.0.1
 * @apiDescription Delete vehicle
 * @apiSampleRequest https://api.kyroslbs.com/vehicle
 *
 * @apiParam {Number} deviceId Vehicle unique ID
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
 *             "deviceId": 123,
 *              "creationTime": "2011-11-04T00:00:00.00Z",
 *              "alias": "Coche auxiliar",
 *              "license": "1243-DSW",
 *              "fleetId": 324
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
/*
router.delete("/vehicle/", function(req, res)
{
     log.info("DELETE: /vehicle");

      var id = req.body.id || req.params.id || req.query.id;
      log.debug("  -> id: " + id);

      if (id == null)
      {
        res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
      }
      else if (typeof parseInt(id) != "number")
      {
        res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.PARAMETER_ERROR_TYPE}})
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
*/
    

module.exports = router;
