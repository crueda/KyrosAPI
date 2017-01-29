var status = require("../utils/statusCodes.js");
var messages = require("../utils/statusMessages.js");
var express = require('express');
var router = express.Router();
var PoiModel = require('../models/poi');

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

/* POST. Obtenemos y mostramos todos los Poi */
/**
 * @api {post} /kyrosapi/Pois Request all Pois
 * @apiName GetPois
 * @apiGroup Poi
 * @apiVersion 1.0.1
 * @apiDescription List of Pois
 * @apiSampleRequest https://api.kyroslbs.com/kyrosapi/Pois
 *
 * @apiParam {Number} [startRow] Number of first element
 * @apiParam {Number} [endRow] Number of last element
 * @apiParam {String="id","description","name","latitude","longitude","categotyId"}  [sortBy]     Results sorting by this param. You may indicate various parameters separated by commas. To indicate descending order you can use the - sign before the parameter
 *
 * @apiSuccess {Object[]} Poi       List of Pois
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
 *              "description": "Explosivo militar",
 *              "name": "exp01",
 *              "latitude": 40.121323,
 *              "longitude": "1.4667878",
 *              "categoryId": "1"
 *           },
 *           {
 *              "id": 124,
 *              "description": "Explosivo militar",
 *              "name": "exp02",
 *              "latitude": 39.121323,
 *              "longitude": "4.4667878",
 *              "height": "1"
 *           }]
 *        }
 *       }
 *     }
 *
 * @apiUse TokenHeader
 * @apiUse LoginError
 * @apiUse PermissionError
 * @apiUse TokenError
 * @apiUse TokenExpiredError
 */
router.post('/Pois/', function(req, res)
{
    log.info("POST: /Pois");

    var startRow = req.body.startRow || req.params.startRow || req.query.startRow;
    var endRow = req.body.endRow || req.params.endRow || req.query.endRow;
    var sortBy = req.body.sortBy || req.params.sortBy || req.query.sortBy;
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
          res.status(200).json({"response": {"status":0,"totalRows":totalRows,"startRow":parseInt(startRow),"endRow":parseInt(endRow),"status":0,"data": { "record": data}}})
        }
        //en otro caso se muestra un error
        else
        {
            res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
        }
    });
});

/* GET. Se obtiene un Poi por su id */
/**
 * @api {get} /kyrosapi/Poi/:id Request Poi information
 * @apiName GetPoi Request Poi information
 * @apiGroup Poi
 * @apiVersion 1.0.1
 * @apiDescription Poi information
 * @apiSampleRequest https://api.kyroslbs.com/kyrosapi/Poi
 *
 * @apiParam {Number} id Poi unique ID
 *
 * @apiSuccess {Number} id Poi unique ID
 * @apiSuccess {String} description Description of Poi
 * @apiSuccess {String} name Name of Poi
 * @apiSuccess {Number} longitude Longitude of the Poi (WGS84)
 * @apiSuccess {Number} latitude Latitude of the Poi (WGS84)
 * @apiSuccess {Number} categoryId Category of POI
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
 *              "description": "Explosivo militar",
 *              "weight": 200,
 *              "latitude": 40.121323,
 *              "longitude": "1.4667878",
 *              "height": "40"
 *           }]
 *        }
 *       }
 *     }
 *
 * @apiError PoiNotFound The <code>id</code> of the Poi was not found.
 *
 * @apiUse TokenHeader
 * @apiUse LoginError
 * @apiUse TokenError
 * @apiUse TokenExpiredError
 * @apiUse MissingRegisterError
 * @apiUse IdNumericError
 */
router.get('/Poi/:id', function(req, res)
{
    var id = req.params.id;
    log.info("GET: /Poi/"+id);

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
                res.status(200).json({"response": {"status":0,"totalRows":1,"startRow":0,"endRow":1,"data": {"record": [data]}}})
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

/* PUT. Actualizar un Poi existente */
/**
 * @api {put} /kyrosapi/Poi/ Update Poi
 * @apiName PutNewPoi
 * @apiGroup Poi
 * @apiVersion 1.0.1
 * @apiDescription Update Poi
 * @apiSampleRequest https://sumo.kyroslbs.com/kyrosapi/Poi
 *
 * @apiParam {Number} id Poi unique ID
 * @apiParam {String} description Description of Poi
 * @apiParam {String} name Name of Poi
 * @apiParam {Number} longitude Longitude of the Poi (WGS84)
 * @apiParam {Number} latitude Latitude of the Poi (WGS84)
 * @apiParam {Number} categoryId Category of Poi
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
 *              "description": "Explosivo militar",
 *              "name": "exp01",
 *              "latitude": 40.121323,
 *              "longitude": "1.4667878",
 *              "categoryId": "1"
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
router.put('/Poi', function(req, res)
{
    log.info("PUT: /Poi");

    var id_value = req.body.id || req.query.id;
    var description_value = req.body.description || req.query.description || req.params.description;
    var name_value = req.body.name || req.query.name || req.params.name;
    var latitude_value = req.body.latitude || req.query.latitude || req.params.latitude;
    var longitude_value = req.body.longitude || req.query.longitude || req.params.longitude;
    var categoryId_value = req.body.categoryId || req.query.categoryId || req.params.categoryId;

    log.debug("  -> id:          " + id_value);
    log.debug("  -> name:        " + name_value);
    log.debug("  -> description: " + description_value);
    log.debug("  -> latitude:    " + latitude_value);
    log.debug("  -> longitude:   " + longitude_value);
    log.debug("  -> categoryId:  " + categoryId_value);

    if (id_value == null || description_value == null || name_value == null || latitude_value == null || longitude_value == null || categoryId_value == null) {
      res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
    }
    else
    {
      //almacenamos los datos del formulario en un objeto
      var PoiData = {
          id : id_value,
          description : description_value,
          name : name_value,
          latitude : latitude_value,
          longitude : longitude_value,
          categoryId : categoryId_value
      };
      PoiModel.updatePoi(PoiData,function(error, data)
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
              res.status(200).json({"response": {"status":0,"data": {"record": [PoiData]}}})
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
 * @api {post} /kyrosapi/Poi/ Create new Poi
 * @apiName PostNewPoi
 * @apiGroup Poi
 * @apiVersion 1.0.1
 * @apiDescription Create new Poi
 * @apiSampleRequest https://api.kyroslbs.com/kyrosapi/Poi
 *
 * @apiParam {String} description Description of Poi
 * @apiParam {String} name Name of Poi
 * @apiParam {Number} longitude Longitude of the Poi (WGS84)
 * @apiParam {Number} latitude Latitude of the UXI (WGS84)
 * @apiParam {Number} categoryId Category of Poi
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
 *              "description": "Explosivo militar",
 *              "name": "exp01",
 *              "latitude": 40.121323,
 *              "longitude": "1.4667878",
 *              "categoryId": "1"
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
router.post("/Poi", function(req,res)
{
    log.info("POST: /Poi");

    // Crear un objeto con los datos a insertar del Poi
    var description_value = req.body.description || req.query.description || req.params.description;
    var name_value = req.body.name || req.query.name || req.params.name;
    var latitude_value = req.body.latitude || req.query.latitude || req.params.latitude;
    var longitude_value = req.body.longitude || req.query.longitude || req.params.longitude;
    var categoryId_value = req.body.categoryId || req.query.categoryId || req.params.categoryId;

    log.debug("  -> description: " + description_value);
    log.debug("  -> name:        " + name_value);
    log.debug("  -> latitude:    " + latitude_value);
    log.debug("  -> longitude:   " + longitude_value);
    log.debug("  -> categoryId:  " + categoryId_value);

    if (description_value == null || name_value == null || latitude_value == null || longitude_value == null || categoryId_value == null) {
      res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
    }
    else
    {
      var PoiData = {
          id : null,
          description : description_value,
          name : name_value,
          latitude : latitude_value,
          longitude : longitude_value,
          categoryId : categoryId_value
      };

      PoiModel.insertPoi(PoiData,function(error, data)
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
              PoiData.id = data.insertId;
              res.status(201).json({"response": {"status":0,"data": {"record": [PoiData]}}})
          }
          else
          {
             res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
          }
        }
      });
    }
});

/* DELETE. Eliminar un Poi */
/**
 * @api {delete} /kyrosapi/Poi Delete Poi
 * @apiName DeletePoi
 * @apiGroup Poi
 * @apiVersion 1.0.1
 * @apiDescription Delete Poi
 * @apiSampleRequest https://sumo.kyroslbs.com/kyrosapi/Poi
 *
 * @apiParam {Number} id Poi unique ID
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
 *              "description": "Explosivo militar",
 *              "name": "exp01",
 *              "latitude": 40.121323,
 *              "longitude": "1.4667878",
 *              "categoryId": "1"
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
router.delete("/Poi/", function(req, res)
{
    log.info("DELETE: /Poi");

    // id del Poi a eliminar
    var id = req.body.id || req.params.id || req.query.id;
    log.debug("  -> id: " + id);

    if (id == null)
    {
      res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
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

module.exports = router;
