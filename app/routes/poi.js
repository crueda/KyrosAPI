var status = require("../utils/statusCodes.js");
var messages = require("../utils/statusMessages.js");
var express = require('express');
var router = express.Router();
var PoiModel = require('../models/poi');

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
 * @apiParam {Number} [startRow] Number of first element
 * @apiParam {Number} [endRow] Number of last element
 * @apiParam {String="id","description","latitude","longitude"}  [sortBy]     Results sorting by this param. You may indicate various parameters separated by commas. To indicate descending order you can use the - sign before the parameter
 *
 * @apiSuccess {Object[]} poi       List of POIs
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
 *       }
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

    var startRow = req.body.startRow;
    var endRow = req.body.endRow;
    var sortBy = req.body.sortBy;
    // Limpiar espacios en blanco
    if (sortBy!=null) {
      sortBy = sortBy.replace(/\s/g, "");
    }

    PoiModel.getPois(startRow, endRow, sortBy, function(error, data, totalRows)
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
 *         "startRow" : 0,
 *         "endRow" : 1,
 *         "totalRows" : 1,
 *         "data" : {
 *         "record" : [
 *           {
 *              "id": 123,
 *              "description": "Centro comercial",
 *              "latitude": 40.121323,
 *              "longitude": "1.4667878"
 *           }]
 *        }
 *       }
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
        PoiModel.getPoi(id,function(error, data)
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

/*
 * @api {put} /poi/ Update POI
 * @apiName PutNewPoi
 * @apiGroup POI
 * @apiVersion 1.0.1
 * @apiDescription Update POI
 * @apiSampleRequest https://api.kyroslbs.com/poi
 *
 * @apiParam {Number} id POI unique ID
 * @apiParam {String} description Description of POI
 * @apiParam {Number} longitude Longitude of the POI (WGS84)
 * @apiParam {Number} latitude Latitude of the POI (WGS84)
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
 *              "description": "Centro de transportes",
 *              "latitude": 40.121323,
 *              "longitude": "1.4667878"
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
/*
router.put('/poi', function(req, res)
{
    log.info("PUT: /poi");

    var id_value = req.body.id || req.query.id;
    var description_value = req.body.description || req.query.description || req.params.description;
    var latitude_value = req.body.latitude || req.query.latitude || req.params.latitude;
    var longitude_value = req.body.longitude || req.query.longitude || req.params.longitude;

    log.debug("  -> id:          " + id_value);
    log.debug("  -> weight:      " + weight_value);
    log.debug("  -> latitude:    " + latitude_value);
    log.debug("  -> longitude:   " + longitude_value);

    if (id_value == null || description_value == null || latitude_value == null || longitude_value == null) {
      res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
    }
    else
    {
      var poiData = {
          id : id_value,
          description : description_value,
          latitude : latitude_value,
          longitude : longitude_value
      };
      PoiModel.updatePoi(poiData,function(error, data)
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
              res.status(200).json({"response": {"status":0,"data": {"record": [poiData]}}})
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
 * @api {post} /poi/ Create new POI
 * @apiName PostNewPoi
 * @apiGroup POI
 * @apiVersion 1.0.1
 * @apiDescription Create new POI
 * @apiSampleRequest https://api.kyroslbs.com/poi
 *
 * @apiParam {String} description Description of POI
 * @apiParam {Number} longitude Longitude of the POI (WGS84)
 * @apiParam {Number} latitude Latitude of the POI (WGS84)
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
 *              "description": "Lugar de reparto",
 *              "latitude": 40.121323,
 *              "longitude": "1.4667878"
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
/*
router.post("/poi", function(req,res)
{
    log.info("POST: /poi");

    // Crear un objeto con los datos a insertar del poi
    var description_value = req.body.description || req.query.description || req.params.description;
    var latitude_value = req.body.latitude || req.query.latitude || req.params.latitude;
    var longitude_value = req.body.longitude || req.query.longitude || req.params.longitude;

    log.debug("  -> description: " + description_value);
    log.debug("  -> latitude:    " + latitude_value);
    log.debug("  -> longitude:   " + longitude_value);

    if (description_value == null || latitude_value == null || longitude_value == null) {
      res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
    }
    else
    {
      var poiData = {
          id : null,
          description : description_value,
          latitude : latitude_value,
          longitude : longitude_value
      };

      PoiModel.insertPoi(poiData,function(error, data)
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
              poiData.id = data.insertId;
              res.status(201).json({"response": {"status":0,"data": {"record": [poiData]}}})
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
 * @api {delete} /poi Delete POI
 * @apiName DeletePoi
 * @apiGroup POI
 * @apiVersion 1.0.1
 * @apiDescription Delete POI
 * @apiSampleRequest https://api.kyroslbs.com/poi
 *
 * @apiParam {Number} id POI unique ID
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
 *              "description": "Centro de reparto",
 *              "latitude": 40.121323,
 *              "longitude": "1.4667878"
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
/*
router.delete("/poi/", function(req, res)
{
    log.info("DELETE: /poi");

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
      PoiModel.deletePoi(id,function(error, data)
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
