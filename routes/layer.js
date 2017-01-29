var status = require("../utils/statusCodes.js");
var messages = require("../utils/statusMessages.js");
var express = require('express');
var router = express.Router();
var LayerModel = require('../models/layer');

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

/* POST. Obtenemos y mostramos todos */
/**
 * @api {post} /kyrosapi/layers Request all layers
 * @apiName GetLayers
 * @apiGroup Layer
 * @apiVersion 1.0.1
 * @apiDescription List of layers
 * @apiSampleRequest https://api.kyroslbs.com/kyrosapi/layers
 *
 * @apiParam {Number} [startRow] Number of first element
 * @apiParam {Number} [endRow] Number of last element
 * @apiParam {String="id","name","showName","visible","transparent"}  [sortBy]     Results sorting by this param. You may indicate various parameters separated by commas. To indicate descending order you can use the - sign before the parameter
 *
 * @apiSuccess {Object[]} layer       List of layers
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
 *             "id": 1,
 *             "name": "Countries",
 *             "showName": "Countries",
 *             "visible": "false",
 *             "transparent": "false"
 *           },
 *           {
 *             "id": 2,
 *             "name": "satellite",
 *             "showName": "Countries satellite",
 *             "visible": "true",
 *             "transparent": "false"
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
router.post('/layers/', function(req, res)
{
    log.info("POST: /layers");

    var startRow = req.body.startRow || req.params.startRow || req.query.startRow;
    var endRow = req.body.endRow || req.params.endRow || req.query.endRow;
    var sortBy = req.body.sortBy || req.params.sortBy || req.query.sortBy;
    // Limpiar espacios en blanco
    if (sortBy!=null) {
      sortBy = sortBy.replace(/\s/g, "");
    }

    LayerModel.getLayers(startRow, endRow, sortBy, function(error, data, totalRows)
    {
        if (data == null)
        {
          res.status(200).json({"response": {"status":0,"description":"Layers data","data": {"record": []}}})
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

/* GET. Se obtiene un layer por su id */
/**
 * @api {get} /kyrosapi/layer/:id Request layer information
 * @apiName GetLayer Request layer information
 * @apiGroup Layer
 * @apiVersion 1.0.1
 * @apiDescription Layer information
 * @apiSampleRequest https://api.kyroslbs.com/kyrosapi/layer
 *
 * @apiParam {Number} id Layer unique ID
 *
 * @apiSuccess {Number} id Identification of the route
 * @apiSuccess {String} name Name of WMS layer
 * @apiSuccess {String} showName Show name of the layer
 * @apiSuccess {String} visible Visibility of the layer ('true' or 'false')
 * @apiSuccess {String} transparent Transparency of the layer ('true' or 'false')
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
 *             "id": 1,
 *             "name": "http://demo.opengeo.org/geoserver/wms",
 *             "showName": "Countries",
 *             "visible": "false",
 *             "transparent": "false"
 *           }]
 *        }
 *       }
 *     }
 *
 * @apiError LayerNotFound The <code>id</code> of the layer was not found
 * @apiUse TokenHeader
 * @apiUse TokenError
 * @apiUse TokenExpiredError
 * @apiUse MissingRegisterError
 * @apiUse IdNumericError
 */
router.get('/layer/:id', function(req, res)
{
    var id = req.params.id;
    log.info("GET: /layer/"+id);

    //se comprueba que la id es un número
    if(!isNaN(id))
    {
      LayerModel.getLayer(id,function(error, data)
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

/* PUT. Actualizamos un layer existente */
/**
 * @api {put} /kyrosapi/layer/ Update layer
 * @apiName PutNewLayer
 * @apiGroup Layer
 * @apiVersion 1.0.1
 * @apiDescription Update layer
 * @apiSampleRequest https://sumo.kyroslbs.com/kyrosapi/layer
 *
 * @apiParam {Number} id Identification of the route
 * @apiParam {String} name Name of WMS layer
 * @apiParam {String} showName Show name of the layer
 * @apiParam {String} visible Visibility of the layer ('true' or 'false')
 * @apiParam {String} transparent Transparency of the layer ('true' or 'false')
 *
 * @apiSuccess {String} message Result message
 * @apiSuccessExample Success-Response:
 *     https/1.1 200 OK
 *     {
 *       "response" :
 *       {
 *         "status" : 0,
 *         "description" : "Layer updated",
 *         "data" : {
 *         "record" : [
 *           {
 *             "id": 1,
 *             "name": "http://demo.opengeo.org/geoserver/wms",
 *             "showName": "Countries",
 *             "visible": "false",
 *             "transparent": "false"
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
router.put('/layer/', function(req, res)
{
    log.info("PUT: /layer");

    var id_value = req.body.id || req.query.id || req.params.id;
    var name_value = req.body.name || req.query.name || req.params.name;
    var showName_value = req.body.showName || req.query.showName || req.params.showName;
    var visible_value = req.body.visible || req.query.visible || req.params.visible;
    var transparent_value = req.body.transparent || req.query.transparent || req.params.transparent;

    log.debug("  -> id:          " + id_value);
    log.debug("  -> name:        " + name_value);
    log.debug("  -> showName:    " + showName_value);
    log.debug("  -> visible:     " + visible_value);
    log.debug("  -> transparent: " + transparent_value);

    if (id_value == null || name_value == null || showName_value == null || visible_value == null || transparent_value == null) {
      res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
    }
    else
    {
      //almacenar los datos en un objeto
      var layerData = {
        id: id_value,
        name: name_value,
        showName: showName_value,
        visible: visible_value,
        transparent: transparent_value
      };

      // Llamar al modelo
      LayerModel.updateLayer(layerData,function(error, data)
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
              res.status(200).json({"response": {"status":0,"data": {"record": [layerData]}}})
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
 * @api {post} /kyrosapi/layer/ Create new layer
 * @apiName PostNewLayer
 * @apiGroup Layer
 * @apiVersion 1.0.1
 * @apiDescription Create new Layer
 * @apiSampleRequest https://api.kyroslbs.com/kyrosapi/layer
 *
 * @apiParam {String} name Name of WMS layer
 * @apiParam {String} showName Show name of the layer
 * @apiParam {String} visible Visibility of the layer ('true' or 'false')
 * @apiParam {String} transparent Transparency of the layer ('true' or 'false')
 *
 * @apiSuccess {String} message Result message
 * @apiSuccessExample Success-Response:
 *     https/1.1 201 OK
 *     {
 *       "response" :
 *       {
 *         "status" : 0,
 *         "data" : {
 *         "record" : [
 *           {
 *             "id": 1,
 *             "name": "http://demo.opengeo.org/geoserver/wms",
 *             "showName": "Countries",
 *             "visible": "false",
 *             "transparent": "false"
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
router.post("/layer", function(req,res)
{
    log.info("POST: /layer");

    var name_value = req.body.name || req.query.name || req.params.name;
    var showName_value = req.body.showName || req.query.showName || req.params.showName;
    var visible_value = req.body.visible || req.query.visible || req.params.visible;
    var transparent_value = req.body.transparent || req.query.transparent || req.params.transparent;

    log.debug("  -> name:        " + name_value);
    log.debug("  -> showName:    " + showName_value);
    log.debug("  -> visible:     " + visible_value);
    log.debug("  -> transparent: " + transparent_value);

    if (name_value == null || showName_value == null || visible_value == null || transparent_value == null) {
      res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
    }
    else
    {
      var layerData = {
        id: null,
        name: name_value,
        showName: showName_value,
        visible: visible_value,
        transparent: transparent_value
      };

      LayerModel.insertLayer(layerData,function(error, data)
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
              layerData.id = data.insertId;
              res.status(201).json({"response": {"status":0,"data": {"record": [layerData]}}})
          }
          else
          {
             res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
          }
        }
      });
    }
});

/* DELETE. Eliminamos un layer */
/**
 * @api {delete} /kyrosapi/layer Delete layer
 * @apiName DeleteLayer
 * @apiGroup Layer
 * @apiVersion 1.0.1
 * @apiDescription Delete layer
 * @apiSampleRequest https://api.kyroslbs.com/kyrosapi/layer
 *
 * @apiParam {Number} id Layer unique ID
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
 *             "id": 1,
 *             "name": "http://demo.opengeo.org/geoserver/wms",
 *             "showName": "Countries",
 *             "visible": "false",
 *             "transparent": "false"
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
router.delete("/layer/", function(req, res)
{
    log.info("DELETE: /layer");

    // id del layer a eliminar
    var id = req.body.id || req.params.id || req.query.id;
    log.debug("  -> id: " + id);

    if (id == null)
    {
      res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
    }
    else
    {
      LayerModel.deleteLayer(id,function(error, data)
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
