var status = require("../utils/statusCodes.js");
var messages = require("../utils/statusMessages.js");
var express = require('express');
var router = express.Router();
var fleetModel = require('../models/fleet');

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
 * @api {post} /fleets Request all fleets
 * @apiName GetFleets
 * @apiGroup Fleet
 * @apiVersion 1.0.1
 * @apiDescription List of fleets
 * @apiSampleRequest https://api.kyroslbs.com/fleets
 *
 * @apiParam {Number} [startRow] Number of first element
 * @apiParam {Number} [endRow] Number of last element
 * @apiParam {String="id","name",description","companyId"}  [sortBy]     Results sorting by this param. You may indicate various parameters separated by commas. To indicate descending order you can use the - sign before the parameter
 *
 * @apiSuccess {Object[]} fleet       List of fleets
 * @apiSuccessExample Success-Response:
 *     https/1.1 200 OK
 *     {
 *       "response" :
 *       {
 *         "status" : 0,
 *         "startRow" : 0,
 *         "endRow" : 2,
 *         "totalRows" : 2,
 *         "data" : {
 *         "record" : [
 *           {
 *              "id": 123,
 *              "name": "Flota1",
 *              "description": "Flota general",
 *              "companyId": 34
 *           },
 *           {
 *              "id": 124,
 *              "name": "Flota2",
 *              "description": "Flota auxiliar",
 *              "companyId": 34
 *           }]
 *        }
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

    var startRow = req.body.startRow;
    var endRow = req.body.endRow;
    var sortBy = req.body.sortBy;
    // Limpiar espacios en blanco
    if (sortBy!=null) {
      sortBy = sortBy.replace(/\s/g, "");
    }

    fleetModel.getFleets(startRow, endRow, sortBy, function(error, data, totalRows)
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
 * @apiVersion 1.0.1
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
 *         "startRow" : 0,
 *         "endRow" : 1,
 *         "totalRows" : 1,
 *         "data" : {
 *         "record" : [
 *           {
 *              "id": 123,
 *              "name": "Flota1",
 *              "description": "Flota general",
 *              "companyId": 34
 *           }]
 *        }
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
                res.status(200).json({"response": {"status":0,"totalRows":1,"startRow":0,"endRow":1,"data": {"record": data}}})
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

/**
 * @api {put} /fleet/ Update fleet
 * @apiName PutNewFleet
 * @apiGroup Fleet
 * @apiVersion 1.0.1
 * @apiDescription Update fleet
 * @apiSampleRequest https://api.kyroslbs.com/fleet
 *
 * @apiParam {Number} id fleet unique ID
 * @apiParam {String} name Name of the fleet
 * @apiParam {String} description Description of the fleet
 * @apiParam {Number} companyId company ID
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
 *              "id": 123,
 *              "name": "Flota1",
 *              "description": "Flota general",
 *              "companyId": 34
 *           }]
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
router.put('/fleet', function(req, res)
{
    log.info("PUT: /fleet");

    var id_value = req.body.id 
    var name_value = req.body.name 
    var description_value = req.body.description 
    var companyId_value = req.body.companyId 

    log.debug("  -> id:          " + id_value);
    log.debug("  -> name:        " + name_value);
    log.debug("  -> description: " + description_value);
    log.debug("  -> companyId:   " + companyId_value);

    if (id_value == null || description_value == null || name_value == null || companyId_value == null) {
      res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
    }
    else
    {
      var fleetData = {
          id : id_value,
          name : name_value,
          description : description_value,
          companyId : companyId_value
      };
      fleetModel.updateFleet(fleetData,function(error, data)
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
              res.status(200).json({"response": {"status":0,"data": {"record": [fleetData]}}})
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
 * @api {post} /fleet/ Create new fleet
 * @apiName PostNewFleet
 * @apiGroup Fleet
 * @apiVersion 1.0.1
 * @apiDescription Create new fleet
 * @apiSampleRequest https://api.kyroslbs.com/fleet
 *
 * @apiParam {String} name Name of the fleet
 * @apiParam {String} description Description of the fleet
 * @apiParam {Number} companyId company ID
 *
 * @apiSuccess {json} message Result message
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
 *              "name": "Flota1",
 *              "description": "Flota general",
 *              "companyId": 34
 *           }]
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
router.post("/fleet", function(req,res)
{
    log.info("POST: /fleet");

    // Crear un objeto con los datos a insertar del fleet
    var name_value = req.body.name 
    var description_value = req.body.description 
    var companyId_value = req.body.companyId 

    log.debug("  -> name:        " + name_value);
    log.debug("  -> description: " + description_value);
    log.debug("  -> companyId:   " + companyId_value);

    if (description_value == null || name_value == null || companyId_value == null) {
      res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
    }
    else if (typeof parseInt(companyId_valua) != "number")
    {
      res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.PARAMETER_ERROR_TYPE}})
    }
    else
    {
      var fleetData = {
          id : null,
          name : name_value,
          description : description_value,
          companyId : companyId_value
      };

      fleetModel.insertFleet(fleetData,function(error, data)
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
              fleetData.id = data.insertId;
              res.status(201).json({"response": {"status":0,"data": {"record": [fleetData]}}})
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
 * @api {delete} /fleet Delete fleet
 * @apiName Deletefleet
 * @apiGroup Fleet
 * @apiVersion 1.0.1
 * @apiDescription Delete fleet
 * @apiSampleRequest https://api.kyroslbs.com/fleet
 *
 * @apiParam {Number} id fleet unique ID
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
 *              "id": 123,
 *              "name": "Flota1",
 *              "description": "Flota general",
 *              "companyId": 34
 *           }]
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
router.delete("/fleet/", function(req, res)
{
    log.info("DELETE: /fleet");

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
      fleetModel.deletefleet(id,function(error, data)
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
