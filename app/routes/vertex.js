var status = require("../utils/statusCodes.js");
var messages = require("../utils/statusMessages.js");
var express = require('express');
var router = express.Router();
var VertexModel = require('../models/vertex');

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

function kcoords(px, py) {
    var x  = Math.abs(x);
    var dx = Math.floor(x);
    var mx = Math.floor((x - dx)*60);
    //var sx = Math.floor(((x - dx) - (mx/60))*3600);
    if (px < 0) dx = -dx;
    var y  = Math.abs(py);
    var dy = Math.floor(y);
    var my = Math.floor((y - dy)*60);
    //var sy = Math.floor(((y - dy) - (my/60))*3600);
    if (py < 0) dy = -dy;
    //return (dx + '°' + mx + 'min ' + sx + 'seg ' + dy + '°' + my + 'min ' + sy + 'seg');
    return (dx + ',' + mx + '-' + dy + ',' + my);
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

/* POST. Obtenemos y mostramos todos los vertices de un area */
/**
 * @api {post} /vertexes/assignedTo/:areaId Request all vertexes assigned to area
 * @apiName GetVertexesArea
 * @apiGroup Area
 * @apiVersion 1.0.1
 * @apiDescription List of vertexes assigned to area
 * @apiSampleRequest https://api.kyroslbs.com/vertexes/assignedTo/1020
 *
 * @apiParam {Number} [startRow] Number of first element
 * @apiParam {Number} [endRow] Number of last element
 * @apiParam {String} [sortBy] Sort order on elements (comma separated)
 * @apiParam {String="id","areaId","description","numVertex","latitude","longitude","altitude"}  [sortBy]     Results sorting by this param. You may indicate various parameters separated by commas. To indicate descending order you can use the - sign before the parameter
 *
 * @apiSuccess {Object[]} vertex       List of vertexes
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
 *            "id": 8505,
 *            "areaId": 892,
 *            "description": "Vértice: 1",
 *            "numVertex": null,
 *            "latitude": 43.314166666666665,
 *            "longitude": -2.033333333333333
 *           },
 *           {
 *            "id": 8506,
 *            "areaId": 892,
 *            "description": "Vértice: 2",
 *            "numVertex": 2,
 *            "latitude": 43.19516498456403,
 *            "longitude": -2.42523193359375
 *           }
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
router.post('/vertexes/assignedTo/:id', function(req, res)
{
    log.info("POST: /vertexes/assignedTo/:id");

    var id = req.params.id;

    var startRow = req.body.startRow || req.params.startRow || req.query.startRow;
    var endRow = req.body.endRow || req.params.endRow || req.query.endRow;
    var sortBy = req.body.sortBy || req.params.sortBy || req.query.sortBy;
    // Limpiar espacios en blanco
    if (sortBy!=null) {
      sortBy = sortBy.replace(/\s/g, "");
    }

    VertexModel.getVertexesArea(id, startRow, endRow, sortBy, function(error, data, totalRows)
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


/* POST. Obtenemos y mostramos todos los vertices */
/**
 * @api {post} /vertexes Request all vertexes
 * @apiName GetVertexes
 * @apiGroup Area
 * @apiVersion 1.0.1
 * @apiDescription List of vertexes
 * @apiSampleRequest https://api.kyroslbs.com/vertexes
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
 *            "id": 8505,
 *            "areaId": 892,
 *            "description": "Vértice: 1",
 *            "numVertex": null,
 *            "latitude": 43.314166666666665,
 *            "longitude": -2.033333333333333
 *           },
 *           {
 *            "id": 8506,
 *            "areaId": 892,
 *            "description": "Vértice: 2",
 *            "numVertex": 2,
 *            "latitude": 43.19516498456403,
 *            "longitude": -2.42523193359375
 *           }
 *           }]
 *        }
 *       }
 *     }
 *
 * @apiSuccess {Object[]} vertex       List of vertexes
 * @apiUse TokenHeader
 * @apiUse PermissionError
 * @apiUse TokenError
 * @apiUse TokenExpiredError
 */
router.post('/vertexes/', function(req, res)
{
    log.info("POST: /vertexes/");

    var startRow = req.body.startRow || req.params.startRow || req.query.startRow;
    var endRow = req.body.endRow || req.params.endRow || req.query.endRow;
    var sortBy = req.body.sortBy || req.params.sortBy || req.query.sortBy;
    // Limpiar espacios en blanco
    if (sortBy!=null) {
      sortBy = sortBy.replace(/\s/g, "");
    }

    VertexModel.getVertexes(startRow, endRow, sortBy, function(error, data, totalRows)
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

/* GET. Se obtiene un vertice por su id */
/**
 * @api {get} /vertex/:id Request vertex information
 * @apiName GetVertex Request vertex information
 * @apiGroup Area
 * @apiVersion 1.0.1
 * @apiDescription Vertex information
 * @apiSampleRequest https://api.kyroslbs.com/vertex
 *
 * @apiParam {Number} id Vertex unique ID
 *
 * @apiSuccess {Number} id Vertex unique ID
 * @apiSuccess {Number} areaId Identification of the area
 * @apiSuccess {String} description Description of the vertex
 * @apiSuccess {Number} numVertex Number of the vertex in the area
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
 *            "id": 8505,
 *            "areaId": 892,
 *            "description": "Vértice: 1",
 *            "numVertex": null,
 *            "latitude": 43.314166666666665,
 *            "longitude": -2.033333333333333
 *           },
 *           }]
 *        }
 *       }
 *     }
 *
 * @apiError VertexNotFound The <code>id</code> of the vertex was not found.
 *
 * @apiUse TokenHeader
 * @apiUse TokenError
 * @apiUse TokenExpiredError
 * @apiUse MissingRegisterError
 * @apiUse IdNumericError
 */
router.get('/vertex/:id', function(req, res)
{
  var id = req.params.id;
    log.info("GET: /vertex/"+id);

    //se comprueba que la id es un número
    if(!isNaN(id))
    {
        VertexModel.getVertex(id,function(error, data)
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

/* PUT. Actualizamos un vertice existente */
/**
 * @api {put} /vertex/ Update vertex
 * @apiName PutNewVertex
 * @apiGroup Area
 * @apiVersion 1.0.1
 * @apiDescription Update vertex
 * @apiSampleRequest https://api.kyroslbs.com/vertex
 *
 * @apiParam {Number} id Vertex unique ID
 * @apiParam {String} areaId Identification of the area
 * @apiParam {String} description Description of the vertex
 * @apiParam {Number} numVertex Number of the vertex in the area
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
 *            "id": 8505,
 *            "areaId": 892,
 *            "description": "Vértice: 1",
 *            "numVertex": null,
 *            "latitude": 43.314166666666665,
 *            "longitude": -2.033333333333333
 *           },
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
router.put('/vertex/', function(req, res)
{
    log.info("PUT: /vertex/");

    var id_value = req.body.id || req.query.id || req.params.id;
    var areaId_value = req.body.areaId || req.query.areaId || req.params.areaId;
    var description_value = req.body.description || req.query.description || req.params.description;
    var numVertex_value = req.body.numVertex || req.query.numVertex || req.params.numVertex;
    var latitude_value = req.body.latitude || req.query.latitude || req.params.latitude
    var longitude_value = req.body.longitude || req.query.longitude || req.params.longitude;

    log.debug("  -> areaId:      " + areaId_value);
    log.debug("  -> description: " + description_value);
    log.debug("  -> numVertex:   " + numVertex_value);
    log.debug("  -> latitude:    " + latitude_value);
    log.debug("  -> longitude:   " + longitude_value);

    if (areaId_value == null || description_value == null || numVertex_value == null || latitude_value == null || longitude_value == null) {
      res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
    }
    else
    {
      //almacenar los datos en un objeto
      var vertexData = {
          id : id_value,
          areaId : areaId_value,
          description : description_value,
          numVertex : numVertex_value,
          latitude : latitude_value,
          longitude : longitude_value
      };

      VertexModel.updateVertex(vertexData,function(error, data)
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
              res.status(200).json({"response": {"status":0,"data": {"record": [vertexData]}}})
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
 * @api {post} /vertex/ Create new vertex
 * @apiName PostNewVertex
 * @apiGroup Area
 * @apiVersion 1.0.1
 * @apiDescription Create new vertex
 * @apiSampleRequest https://api.kyroslbs.com/vertex
 *
 * @apiParam {Number} areaId Area identification
 * @apiParam {String} description Description of the vertex
 * @apiParam {Number} numVertex Number of the vertex in the area
 * @apiParam {Number} latitude Vertex latitude
 * @apiParam {Number} longitude Vertex longitude
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
 *            "id": 8505,
 *            "areaId": 892,
 *            "description": "Vértice: 1",
 *            "numVertex": null,
 *            "latitude": 43.314166666666665,
 *            "longitude": -2.033333333333333
 *           },
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
router.post("/vertex", function(req,res)
{
    log.info("POST: /vertex/");

    var areaId_value = req.body.areaId || req.query.areaId || req.params.id;
    var description_value = req.body.description || req.query.description || req.params.description;
    var numVertex_value = req.body.numVertex || req.query.numVertex || req.params.numVertex;
    var latitude_value = req.body.latitude || req.query.latitude || req.params.latitude;
    var longitude_value = req.body.longitude || req.query.longitude || req.params.longitude;

    log.debug("  -> areaId:      " + areaId_value);
    log.debug("  -> description: " + description_value);
    log.debug("  -> numVertex:   " + numVertex_value);
    log.debug("  -> latitude:    " + latitude_value);
    log.debug("  -> longitude:   " + longitude_value);

    if (areaId_value == null || description_value == null || numVertex_value == null || latitude_value == null || longitude_value == null) {
      res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
    }
    else
    {
      // Crear un objeto con los datos a insertar del vertice
      var vertexData = {
          id : null,
          areaId : areaId_value,
          description : description_value,
          numVertex : numVertex_value,
          latitude : latitude_value,
          longitude : longitude_value
      };

      VertexModel.insertVertex(vertexData,function(error, data)
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
              vertexData.id = data.insertId;
              res.status(201).json({"response": {"status":0,"data": {"record": [vertexData]}}})
          }
          else
          {
             res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
          }
        }
      });
    }
});

/* DELETE. Eliminar un vertice */
/**
 * @api {delete} /vertex Delete vertex
 * @apiName DeleteVertex
 * @apiGroup Area
 * @apiVersion 1.0.1
 * @apiDescription Delete vertex
 * @apiSampleRequest https://api.kyroslbs.com/vertex
 *
 * @apiParam {Number} id Vertex unique ID
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
 *            "id": 8505,
 *            "areaId": 892,
 *            "description": "Vértice: 1",
 *            "numVertex": null,
 *            "latitude": 43.314166666666665,
 *            "longitude": -2.033333333333333
 *           },
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
router.delete("/vertex/", function(req, res)
{
   log.info("DELETE: /vertex/");

    // id del elemento a eliminar
    var id = req.body.id || req.params.id || req.query.id;
    log.debug("  -> id: " + id);

    if (id == null)
    {
      res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
    }
    else
    {
      VertexModel.deleteVertex(id,function(error, data)
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
