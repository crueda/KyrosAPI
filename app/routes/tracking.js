var status = require("../utils/statusCodes.js");
var messages = require("../utils/statusMessages.js");
var express = require('express');
var router = express.Router();
var TrackingModel = require('../models/tracking');

// Fichero de propiedades
var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('kyrosapi.properties');

// Definición del log
var fs = require('fs');
var log = require('tracer').console({
  transtracking: function (data) {
    //console.log(data.output);
    fs.open(properties.get('main.log.file'), 'a', 0666, function (e, id) {
      fs.write(id, data.output + "\n", null, 'utf8', function () {
        fs.close(id, function () {
        });
      });
    });
  }
});
var access_log = require('tracer').console({
  format: "              {{message}}",
  transport: function (data) {
    fs.open(properties.get('main.access_log.file'), 'a', 0666, function (e, id) {
      fs.write(id, data.output + "\n", null, 'utf8', function () {
        fs.close(id, function () {
        });
      });
    });
  }
});

function kcoords(px, py) {
  var x = Math.abs(x);
  var dx = Math.floor(x);
  var mx = Math.floor((x - dx) * 60);
  //var sx = Math.floor(((x - dx) - (mx/60))*3600);
  if (px < 0) dx = -dx;
  var y = Math.abs(py);
  var dy = Math.floor(y);
  var my = Math.floor((y - dy) * 60);
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

/* POST. Se obtiene tracking 1 de una flota */
/** 
* @api {post} /tracking1/fleet/:id Last tracking position of a fleet
* @apiName PostTracking1Fleet 
* @apiGroup Tracking
* @apiVersion 1.0.1
* @apiDescription List of last trackings from fleet
* @apiSampleRequest https://api.kyroslbs.com/tracking1/fleet/143
*
* @apiParam {String} id Identification of the fleet
*
* @apiSuccess {Number} id tracking unique ID
* @apiSuccess {Number} deviceId Identification of the element
* @apiSuccess {Number} altitude Altitude over the sea level (in meters)
* @apiSuccess {Number} speed Speed value (in Km/h)
* @apiSuccess {Number} heading Heading value (in degress)
* @apiSuccess {Number} longitude Longitude of the tracking (WGS84)
* @apiSuccess {Number} latitude Latitude of the tracking (WGS84)
* @apiSuccess {String} trackingDate Date of the tracking (in ISO format)
* @apiSuccessExample Success-Response:
*     https/1.1 200 OK
*     {
*       "response" :
*       {
*         "status" : 0,
*         "data": {
*           "record": [
*           {
*            "id": 123,
*            "deviceId": 13432,
*            "latitude": 43.314166666666665,
*            "longitude": -2.033333333333333,
*            "altitude": 0,
*            "speed": 34,
*            "heading": 120,
*            "trackingDate": "2015-10-04T00:00:00.00Z"
*           },
*           }]
*        }
*       }
*     }
*
* @apiError fleetNotFound The <code>id</code> of the fleet was not found.
*
* @apiUse TokenHeader
* @apiUse TokenError
* @apiUse TokenExpiredError
* @apiUse MissingRegisterError
* @apiUse IdNumericError
*/

router.post('/tracking1/fleet/:id', function (req, res) {
  var id = req.params.id;

  log.info("POST: /tracking1/fleet/" + id);
  access_log.info("PARAM >>> " + "id: " + id);

  TrackingModel.getTracking1FromFleet(id, function (error, data) {
    if (data == null) {
      res.status(200).json({ "response": { "status": 0, "data": { "record": [] } } })
    }
    else if (typeof data !== 'undefined') {
      res.status(200).json({ "response": { "status": 0, "data": { "record": data } } })
    }
    //en otro caso se muestra error
    else {
      res.status(202).json({ "response": { "status": status.STATUS_FAILURE, "description": messages.DB_ERROR } })
    }
  });

});

/* POST. Se obtiene tracking 1 de un vehiculo */
/** 
* @api {post} /tracking1/vehicle/:id Last position of a vehicle
* @apiName PostTracking1Vehicle 
* @apiGroup Tracking
* @apiVersion 1.0.1
* @apiDescription List of last trackings of a vehicle
* @apiSampleRequest https://api.kyroslbs.com/tracking1/vehicle/460
*
* @apiParam {String} id Identification of the vehicle
*
* @apiSuccess {Number} id tracking unique ID
* @apiSuccess {Number} deviceId Identification of the element
* @apiSuccess {Number} altitude Altitude over the sea level (in meters)
* @apiSuccess {Number} speed Speed value (in Km/h)
* @apiSuccess {Number} heading Heading value (in degress)
* @apiSuccess {Number} longitude Longitude of the tracking (WGS84)
* @apiSuccess {Number} latitude Latitude of the tracking (WGS84)
* @apiSuccess {String} trackingDate Date of the tracking (in ISO format)
* @apiSuccessExample Success-Response:
*     https/1.1 200 OK
*     {
*       "response" :
*       {
*         "status" : 0,
*         "data": {
*           "record": [
*           {
*            "id": 123,
*            "deviceId": 13432,
*            "latitude": 43.314166666666665,
*            "longitude": -2.033333333333333,
*            "altitude": 0,
*            "speed": 34,
*            "heading": 120,
*            "trackingDate": "2015-10-04T00:00:00Z"
*           },
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
* @apiUse MissingRegisterError
* @apiUse IdNumericError
*/

router.post('/tracking1/vehicle/:id', function (req, res) {
  var id = req.params.id;

  log.info("POST: /tracking1/vehicle/" + id);
  access_log.info("PARAM >>> " + "id: " + id);

  TrackingModel.getTracking1FromVehicle(id, function (error, data) {
    if (data == null) {
      res.status(200).json({ "response": { "status": 0, "data": { "record": [] } } })
    }
    else if (typeof data !== 'undefined') {
      res.status(200).json({ "response": { "status": 0, "data": { "record": data } } })
    }
    //en otro caso se muestra error
    else {
      res.status(202).json({ "response": { "status": status.STATUS_FAILURE, "description": messages.DB_ERROR } })
    }
  });

});

/* POST. Se obtiene tracking 1 de una lista de flotas */
/** 
* @api {post} /tracking1/fleets Last position of a group of fleets
* @apiName PostTracking1Fleets 
* @apiGroup Tracking
* @apiVersion 1.0.1
* @apiDescription List of last trackings of a group of fleet
* @apiSampleRequest https://api.kyroslbs.com/tracking1/fleets
*
* @apiParam {json} data Group of fleets
* @apiParamExample {json} data
* {"fleets":[1,2]}
*
* @apiSuccess {Number} id tracking unique ID
* @apiSuccess {Number} deviceId Identification of the element
* @apiSuccess {Number} altitude Altitude over the sea level (in meters)
* @apiSuccess {Number} speed Speed value (in Km/h)
* @apiSuccess {Number} heading Heading value (in degress)
* @apiSuccess {Number} longitude Longitude of the tracking (WGS84)
* @apiSuccess {Number} latitude Latitude of the tracking (WGS84)
* @apiSuccess {String} trackingDate Date of the tracking (in ISO format)
* @apiSuccessExample Success-Response:
*     https/1.1 200 OK
*     {
*       "response" :
*       {
*         "status" : 0,
*         "data": {
*           "record": [
*           {
*            "id": 123,
*            "deviceId": 13432,
*            "latitude": 43.314166666666665,
*            "longitude": -2.033333333333333,
*            "altitude": 0,
*            "speed": 34,
*            "heading": 120,
*            "trackingDate": "2015-10-04T00:00:00Z"
*           },
*           }]
*        }
*       }
*     }
*
*
* @apiUse TokenHeader
* @apiUse TokenError
* @apiUse TokenExpiredError
* @apiUse MissingRegisterError
* @apiUse IdNumericError
*/

router.post('/tracking1/fleets', function (req, res) {
  log.info("POST: /tracking1/fleets");
  access_log.info("BODY >>> " + req.body);

  TrackingModel.getTracking1FromFleets(req.body.fleets.toString(), function (error, data) {
    if (data == null) {
      res.status(200).json({ "response": { "status": 0, "data": { "record": [] } } })
    }
    else if (typeof data !== 'undefined') {
      res.status(200).json({ "response": { "status": 0, "data": { "record": data } } })
    }
    else {
      res.status(202).json({ "response": { "status": status.STATUS_FAILURE, "description": messages.DB_ERROR } })
    }
  });
});

/* POST. Se obtiene tracking 1 de una lista de vehiculos */
/** 
* @api {post} /tracking1/vehicles Last position of a group of vehicles
* @apiName PostTracking1Vehicles 
* @apiGroup Tracking
* @apiVersion 1.0.1
* @apiDescription List of last trackings of a group of vehicles
* @apiSampleRequest https://api.kyroslbs.com/tracking1/vehicles
*
* @apiParam {json} data Group of vehicles
* @apiParamExample {json} data
* {"vehicles":[1,2]}
*
* @apiSuccess {Number} id tracking unique ID
* @apiSuccess {Number} deviceId Identification of the element
* @apiSuccess {Number} altitude Altitude over the sea level (in meters)
* @apiSuccess {Number} speed Speed value (in Km/h)
* @apiSuccess {Number} heading Heading value (in degress)
* @apiSuccess {Number} longitude Longitude of the tracking (WGS84)
* @apiSuccess {Number} latitude Latitude of the tracking (WGS84)
* @apiSuccess {String} trackingDate Date of the tracking (in ISO format)
* @apiSuccessExample Success-Response:
*     https/1.1 200 OK
*     {
*       "response" :
*       {
*         "status" : 0,
*         "data": {
*           "record": [
*           {
*            "id": 123,
*            "deviceId": 13432,
*            "latitude": 43.314166666666665,
*            "longitude": -2.033333333333333,
*            "altitude": 0,
*            "speed": 34,
*            "heading": 120,
*            "trackingDate": "2015-10-04T00:00:00Z"
*           },
*           }]
*        }
*       }
*     }
*
*
* @apiUse TokenHeader
* @apiUse TokenError
* @apiUse TokenExpiredError
* @apiUse MissingRegisterError
* @apiUse IdNumericError
*/

router.post('/tracking1/vehicles', function (req, res) {
  log.info("POST: /tracking1/vehicles");
  access_log.info("BODY >>> " + req.body);


  TrackingModel.getTracking1FromVehicles(req.body.vehicles.toString(), function (error, data) {
    if (data == null) {
      res.status(200).json({ "response": { "status": 0, "data": { "record": [] } } })
    }
    else if (typeof data !== 'undefined') {
      res.status(200).json({ "response": { "status": 0, "data": { "record": data } } })
    }
    else {
      res.status(202).json({ "response": { "status": status.STATUS_FAILURE, "description": messages.DB_ERROR } })
    }
  });
});








/* POST. Obtenemos y mostramos todos los tracking */
/*
* @api {post} /tracking Request all tracking
* @apiName GetTrackings
* @apiGroup Tracking
* @apiVersion 1.0.1
* @apiDescription List of trackings
*
* @apiParam {Number} startRow Number of first element
* @apiParam {Number} endRow Number of last element
* @apiParam {String="id","deviceId","speed","altitude","heading","latitude","longitude"}  [sortBy]     Results sorting by this param. You may indicate various parameters separated by commas. To indicate descending order you can use the - sign before the parameter
*
* @apiSampleRequest https://api.kyroslbs.com/trackings
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
*            "id": 123,
*            "deviceId": 13432,
*            "latitude": 43.314166666666665,
*            "longitude": -2.033333333333333,
*            "altitude": 0,
*            "speed": 34,
*            "heading": 120,
*            "trackingDate": "2015-10-04T00:00:00Z"
*           },
*           {
*            "id": 124,
*            "deviceId": 23435,
*            "latitude": 41.232326665,
*            "longitude": 7.234324,
*            "altitude": 0,
*            "speed": 12,
*            "heading": 45,
*            "trackingDate": "2013-09-04T00:00:00Z"
*           }
*           }]
*        }
*       }
*     }
*
* @apiSuccess {Object[]} tracking       List of trackings
* @apiUse TokenHeader
* @apiUse PermissionError
* @apiUse TokenError
* @apiUse TokenExpiredError
*/
/*
router.post('/trackings/', function(req, res)
{
  log.info("POST: /trackings/");

  var startRow = req.body.startRow || req.params.startRow || req.query.startRow;
  var endRow = req.body.endRow || req.params.endRow || req.query.endRow;
  var sortBy = req.body.sortBy || req.params.sortBy || req.query.sortBy;

  if (startRow == null || endRow == null) {
    res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
  }
  else
  {
    // Limpiar espacios en blanco
    if (sortBy!=null) {
      sortBy = sortBy.replace(/\s/g, "");
    }

    TrackingModel.getTrackings(startRow, endRow, sortBy, function(error, data, totalRows)
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
  }
});
*/

/* POST. Se obtiene trackings de un vehiculo */
/*
* @api {post} /trackings/vehicle/:id Request all tracking from vehicle
* @apiName PostTracking 
* @apiGroup Tracking
* @apiVersion 1.0.1
* @apiDescription List of trackings from vehicle
* @apiSampleRequest https://api.kyroslbs.com/trackings/vehicle/1231-BCW
*
* @apiParam {Number} id vehicle unique ID
* @apiParam {Number} startRow Number of first element
* @apiParam {Number} endRow Number of last element
* @apiParam {String="id","speed","altitude","heading","latitude","longitude"}  [sortBy]     Results sorting by this param. You may indicate various parameters separated by commas. To indicate descending order you can use the - sign before the parameter
*
* @apiSuccess {Number} id tracking unique ID
* @apiSuccess {Number} deviceId Identification of the element
* @apiSuccess {Number} altitude Altitude over the sea level (in meters)
* @apiSuccess {Number} speed Speed value (in Km/h)
* @apiSuccess {Number} heading Heading value (in degress)
* @apiSuccess {Number} longitude Longitude of the tracking (WGS84)
* @apiSuccess {Number} latitude Latitude of the tracking (WGS84)
* @apiSuccess {String} trackingDate Date of the tracking (in ISO format)
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
*            "id": 123,
*            "deviceId": 13432,
*            "latitude": 43.314166666666665,
*            "longitude": -2.033333333333333,
*            "altitude": 0,
*            "speed": 34,
*            "heading": 120,
*            "trackingDate": "2015-10-04T00:00:00Z"
*           },
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
* @apiUse MissingRegisterError
* @apiUse IdNumericError
*/
/*
router.post('/trackings/vehicle/:id', function(req, res)
{
  var id = req.params.id;
  log.info("POST: /trackings/vessel/"+id);

  var startRow = req.body.startRow || req.params.startRow || req.query.startRow;
  var endRow = req.body.endRow || req.params.endRow || req.query.endRow;
  var sortBy = req.body.sortBy || req.params.sortBy || req.query.sortBy;

  if (startRow == null || endRow == null) {
    res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
  }
  else
  {
    // Limpiar espacios en blanco
    if (sortBy!=null) {
      sortBy = sortBy.replace(/\s/g, "");
    }

    TrackingModel.getTrackingsFromVehicle(id, startRow, endRow, sortBy, function(error, data, totalRows)
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
  }
});
*/

/* GET. Se obtiene un tracking por su id */
/*
* @api {get} /tracking/:id Request tracking information
* @apiName GetTracking Request tracking information
* @apiGroup Tracking
* @apiVersion 1.0.1
* @apiDescription Tracking information
* @apiSampleRequest https://api.kyroslbs.com/tracking/234235621
*
* @apiParam {Number} id tracking unique ID
*
* @apiSuccess {Number} id tracking unique ID
* @apiSuccess {Number} deviceId Identification of the vehicle
* @apiSuccess {Number} altitude Altitude over the sea level (in meters)
* @apiSuccess {Number} speed Speed value (in Km/h)
* @apiSuccess {Number} heading Heading value (in degress)
* @apiSuccess {Number} longitude Longitude of the tracking (WGS84)
* @apiSuccess {Number} latitude Latitude of the tracking (WGS84)
* @apiSuccess {String} trackingDate Date of the tracking (in ISO format)
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
*            "id": 123,
*            "deviceId": 13432,
*            "latitude": 43.314166666666665,
*            "longitude": -2.033333333333333,
*            "altitude": 0,
*            "speed": 34,
*            "heading": 120,
*            "trackingDate": "2015-10-04T00:00:00Z"
*           },
*           }]
*        }
*       }
*     }
*
* @apiError trackingNotFound The <code>id</code> of the tracking was not found.
*
* @apiUse TokenHeader
* @apiUse TokenError
* @apiUse TokenExpiredError
* @apiUse MissingRegisterError
* @apiUse IdNumericError
*/
/*
router.get('/tracking/:id', function(req, res)
{
  var id = req.params.id;
  log.info("GET: /tracking/"+id);

  //se comprueba que la id es un número
  if(!isNaN(id))
  {
    TrackingModel.getTracking(id,function(error, data)
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
*/

/* PUT. Actualizamos un tracking existente */
/*
* @api {put} /tracking/ Update tracking
* @apiName PutNewtracking
* @apiGroup tracking
* @apiVersion 1.0.1
* @apiDescription Update tracking
* @apiSampleRequest https://api.kyroslbs.com/tracking
*
* @apiParam {Number} id tracking unique ID
* @apiParam {Number} altitude Altitude over the sea level (in meters)
* @apiParam {Number} speed Speed value (in Km/h)
* @apiParam {Number} heading Heading value (in degress)
* @apiParam {Number} longitude Longitude of the tracking (WGS84)
* @apiParam {Number} latitude Latitude of the tracking (WGS84)
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
*            "id": 123,
*            "deviceId": 13432,
*            "latitude": 43.314166666666665,
*            "longitude": -2.033333333333333,
*            "altitude": 0,
*            "speed": 34,
*            "heading": 120,
*            "trackingDate": "2015-10-04T00:00:00Z"
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
/*
router.put('/tracking/', function(req, res)
{
  log.info("PUT: /tracking/");

  var id_value = req.body.id;
  var altitude_value = req.body.altitude;
  var speed_value = req.body.speed;
  var heading_value = req.body.heading;
  var latitude_value = req.body.latitude;
  var longitude_value = req.body.longitude;

  log.debug("  -> id:          " + id_value);
  log.debug("  -> altitude:    " + altitude_value);
  log.debug("  -> speed:       " + speed_value);
  log.debug("  -> heading:     " + heading_value);
  log.debug("  -> latitude:    " + latitude_value);
  log.debug("  -> longitude:   " + longitude_value);

  if (id_value == null || altitude_value == null || speed_value == null || heading_value == null || latitude_value == null || longitude_value == null) {
    res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
  }
  else
  {
    //almacenar los datos en un objeto
    var trackingData = {
      id : id_value,
      altitude : altitude_value,
      speed : speed_value,
      heading : heading_value,
      latitude : latitude_value,
      longitude : longitude_value
    };

    TrackingModel.updateTracking(trackingData,function(error, data)
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
          res.status(200).json({"response": {"status":0,"data": {"record": [trackingData]}}})
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
* @api {post} /tracking/ Create new tracking
* @apiName PostNewtracking
* @apiGroup tracking
* @apiVersion 1.0.1
* @apiDescription Create new tracking
* @apiSampleRequest https://api.kyroslbs.com/tracking
*
* @apiParam {Number} altitude Altitude over the sea level (in meters)
* @apiParam {Number} speed Speed value (in Km/h)
* @apiParam {Number} heading Heading value (in degress)
* @apiParam {Number} longitude Longitude of the tracking (WGS84)
* @apiParam {Number} latitude Latitude of the tracking (WGS84)
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
*            "id": 123,
*            "elementId": 13432,
*            "latitude": 43.314166666666665,
*            "longitude": -2.033333333333333,
*            "altitude": 0,
*            "speed": 34,
*            "heading": 120,
*            "trackingDate": "2015-10-04T00:00:00Z"
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
/*
router.post("/tracking", function(req,res)
{
  log.info("POST: /tracking/");

  var altitude_value = req.body.altitude;
  var speed_value = req.body.speed;
  var heading_value = req.body.heading;
  var latitude_value = req.body.latitude;
  var longitude_value = req.body.longitude;

  log.debug("  -> altitude:    " + altitude_value);
  log.debug("  -> speed:       " + speed_value);
  log.debug("  -> heading:     " + heading_value);
  log.debug("  -> latitude:    " + latitude_value);
  log.debug("  -> longitude:   " + longitude_value);

  if (altitude_value == null || speed_value == null || heading_value == null || latitude_value == null || longitude_value == null) {
    res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
  }
  else
  {
    //almacenar los datos en un objeto
    var trackingData = {
      id : null,
      altitude : altitude_value,
      speed : speed_value,
      heading : heading_value,
      latitude : latitude_value,
      longitude : longitude_value
    };

    TrackingModel.insertTracking(trackingData,function(error, data)
    {
      if (data == null)
      {
        res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
      }
      else
      {
        // si se ha insertado correctamente mostramos su mensaje de exito
        if(data && data.insertId)
        {
          trackingData.id = data.insertId;
          res.status(201).json({"response": {"status":0,"data": {"record": [trackingData]}}})
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

/* DELETE. Eliminar un tracking */
/*
* @api {delete} /tracking Delete tracking
* @apiName Deletetracking
* @apiGroup tracking
* @apiVersion 1.0.1
* @apiDescription Delete tracking
* @apiSampleRequest https://api.kyroslbs.com/tracking
*
* @apiParam {Number} id tracking unique ID
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
*            "id": 123,
*            "deviceId": 13432,
*            "latitude": 43.314166666666665,
*            "longitude": -2.033333333333333,
*            "altitude": 0,
*            "speed": 34,
*            "heading": 120,
*            "trackingDate": "2015-10-04T00:00:00Z"
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
/*
router.delete("/tracking/", function(req, res)
{
  log.info("DELETE: /tracking/");

  // id del elemento a eliminar
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
    TrackingModel.deleteTracking(id,function(error, data)
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
