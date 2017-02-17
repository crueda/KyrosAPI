var status = require("../utils/statusCodes.js");
var messages = require("../utils/statusMessages.js");
var express = require('express');
var router = express.Router();
var jwt = require('jwt-simple');
var TrackingModel = require('../models/tracking');
var VehicleModel = require('../models/vehicle');

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
* @apiVersion 1.0.2
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
* @apiSuccess {String} trackingDate GMT Date of the tracking (in ISO format)
* @apiSuccessExample Success-Response:
*     https/1.1 200 OK
*     {
*       "response" :
*       {
*         "status" : 0,
*         "count" : 1,
*         "record": [
*           {
*            "id": 123,
*            "deviceId": 13432,
*            "latitude": 43.314166666666665,
*            "longitude": -2.033333333333333,
*            "altitude": 0,
*            "speed": 34,
*            "heading": 120,
*            "trackingDate": "2015-10-04T00:00:00.00Z"
*           }]
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
      res.status(200).json({ "response": { "status": 0,  "count": 0, "data": [] } } );
    }
    else if (typeof data !== 'undefined') {
      res.status(200).json({ "response": { "status": 0,  "count": data.length, "data": data } } );
    }
    //en otro caso se muestra error
    else {
      res.status(202).json({ "response": { "status": status.STATUS_FAILURE, "description": messages.DB_ERROR } });
    }
  });

});

/* POST. Se obtiene tracking 1 de un vehiculo */
/** 
* @api {post} /tracking1/vehicle/:id Last position of a vehicle
* @apiName PostTracking1Vehicle 
* @apiGroup Tracking
* @apiVersion 1.0.2
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
* @apiSuccess {String} trackingDate GMT Date of the tracking (in ISO format)
* @apiSuccessExample Success-Response:
*     https/1.1 200 OK
*     {
*       "response" :
*       {
*         "status" : 0,
*         "count" : 1,
*         "data": [
*           {
*            "id": 123,
*            "deviceId": 13432,
*            "latitude": 43.314166666666665,
*            "longitude": -2.033333333333333,
*            "altitude": 0,
*            "speed": 34,
*            "heading": 120,
*            "trackingDate": "2015-10-04T00:00:00Z"
*           }]
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
      res.status(200).json({ "response": { "status": 0, "count": 0, "data": [] } } );
    }
    else if (typeof data !== 'undefined') {
      res.status(200).json({ "response": { "status": 0,  "count": data.length, "data": data } } );
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
* @apiVersion 1.0.2
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
* @apiSuccess {String} trackingDate GMT Date of the tracking (in ISO format)
* @apiSuccessExample Success-Response:
*     https/1.1 200 OK
*     {
*       "response" :
*       {
*         "status" : 0,
*         "count" : 1,
*         "data": [
*           {
*            "id": 123,
*            "deviceId": 13432,
*            "latitude": 43.314166666666665,
*            "longitude": -2.033333333333333,
*            "altitude": 0,
*            "speed": 34,
*            "heading": 120,
*            "trackingDate": "2015-10-04T00:00:00Z"
*           }]
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
      res.status(200).json({ "response": { "status": 0,  "count": 0, "data": [] } } );
    }
    else if (typeof data !== 'undefined') {
      res.status(200).json({ "response": { "status": 0,  "count": data.length, "data": data } } );
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
* @apiVersion 1.0.2
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
* @apiSuccess {String} trackingDate GMT Date of the tracking (in ISO format)
* @apiSuccessExample Success-Response:
*     https/1.1 200 OK
*     {
*       "response" :
*       {
*         "status" : 0,
*         "count" : 1,
*         "data": [
*           {
*            "id": 123,
*            "deviceId": 13432,
*            "latitude": 43.314166666666665,
*            "longitude": -2.033333333333333,
*            "altitude": 0,
*            "speed": 34,
*            "heading": 120,
*            "trackingDate": "2015-10-04T00:00:00Z"
*           }]
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
      res.status(200).json({ "response": { "status": 0, "count": 0,  "data": [] } } )
    }
    else if (typeof data !== 'undefined') {
      res.status(200).json({ "response": { "status": 0, "count": data.length, "data": data } } )
    }
    else {
      res.status(202).json({ "response": { "status": status.STATUS_FAILURE, "description": messages.DB_ERROR } })
    }
  });
});

/* POST. Se obtiene tracking 1 de todos los vehiculos */
/** 
* @api {post} /tracking1 Last position of all vehicles
* @apiName PostTracking1AllVehicles 
* @apiGroup Tracking
* @apiVersion 1.0.2
* @apiDescription List of last trackings of all vehicles
* @apiSampleRequest https://api.kyroslbs.com/tracking1
*
*
* @apiSuccess {Number} id tracking unique ID
* @apiSuccess {Number} deviceId Identification of the element
* @apiSuccess {Number} altitude Altitude over the sea level (in meters)
* @apiSuccess {Number} speed Speed value (in Km/h)
* @apiSuccess {Number} heading Heading value (in degress)
* @apiSuccess {Number} longitude Longitude of the tracking (WGS84)
* @apiSuccess {Number} latitude Latitude of the tracking (WGS84)
* @apiSuccess {String} trackingDate GMT Date of the tracking (in ISO format)
* @apiSuccessExample Success-Response:
*     https/1.1 200 OK
*     {
*       "response" :
*       {
*         "status" : 0,
*         "count" : 2,
*         "data": [
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
*            "id": 123,
*            "deviceId": 13432,
*            "latitude": 43.314166666666665,
*            "longitude": -2.033333333333333,
*            "altitude": 0,
*            "speed": 34,
*            "heading": 120,
*            "trackingDate": "2015-10-04T00:00:00Z"
*           }]
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

router.post('/tracking1', function (req, res) {
  log.info("POST: /tracking1");

  var token = req.headers['x-access-token'] || req.headers['x-access'];
  var decoded = jwt.decode(token, require('../config/secret.js')());
  var username = decoded.iss;
  if (username == '') {
    username = decoded.jti;
  }
  access_log.info("USERNAME >>> " + username);

  VehicleModel.getVehiclesFromUsername(username, function (error, data) {
    if (data != undefined && data.length > 0) {
      TrackingModel.getTracking1FromVehicles(data, function (error, data) {
        if (data == null) {
          res.status(200).json({ "response": { "status": 0, "count":0, "data": [] } } )
        }
        else if (typeof data !== 'undefined') {
          res.status(200).json({ "response": { "status": 0, "count": data.length, "data": data } } )
        }
        else {
          res.status(202).json({ "response": { "status": status.STATUS_FAILURE, "description": messages.DB_ERROR } })
        }
      });

    }
    else {
      res.status(200).json({ "response": { "status": 0, "count":0, "data": [] } } )
    }
  });
});

router.post('/tracking1vehicles', function (req, res) {
  log.info("POST: /tracking1vehicles");

  var token = req.headers['x-access-token'] || req.headers['x-access'];
  var decoded = jwt.decode(token, require('../config/secret.js')());
  var username = decoded.iss;
  if (username == '') {
    username = decoded.jti;
  }
  access_log.info("USERNAME >>> " + username);

  VehicleModel.getVehiclesFromUsername(username, function (error, data) {
    if (data != undefined && data.length > 0) {
      TrackingModel.getTracking1FromVehiclesGrouped(data.toString(), function (error, data) {
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

    }
    else {
      res.status(200).json({ "response": { "status": 0, "data": { "record": [] } } })
    }
  });
});

/* POST. Se obtiene tracking de un vehiculo */
/** 
* @api {post} /tracking1/vehicle/:id Historic positions of a vehicle
* @apiName PostTrackingVehicle 
* @apiGroup Tracking
* @apiVersion 1.0.2
* @apiDescription List of trackings of a vehicle
* @apiSampleRequest https://api.kyroslbs.com/tracking/vehicle/460
*
* @apiParam {json} data Group of vehicles
* @apiParamExample {json} data with range GMT dates in ISO format
* {"initDate":"2017-02-01T06:02:06Z", "endDate": "2017-02-02T06:02:06Z"}
*
* @apiSuccess {Number} id tracking unique ID
* @apiSuccess {Number} deviceId Identification of the element
* @apiSuccess {Number} altitude Altitude over the sea level (in meters)
* @apiSuccess {Number} speed Speed value (in Km/h)
* @apiSuccess {Number} heading Heading value (in degress)
* @apiSuccess {Number} longitude Longitude of the tracking (WGS84)
* @apiSuccess {Number} latitude Latitude of the tracking (WGS84)
* @apiSuccess {String} trackingDate GMT Date of the tracking (in ISO format)
* @apiSuccessExample Success-Response:
*     https/1.1 200 OK
*     {
*       "response" :
*       {
*         "status" : 0,
*         "count" : 1,
*         "data": [
*           {
*            "id": 123,
*            "deviceId": 13432,
*            "latitude": 43.314166666666665,
*            "longitude": -2.033333333333333,
*            "altitude": 0,
*            "speed": 34,
*            "heading": 120,
*            "trackingDate": "2017-02-02T00:00:00Z"
*           }]
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

router.post('/tracking/vehicle/:id', function (req, res) {
  var id = req.params.id;

  log.info("POST: /tracking/vehicle/" + id);
  access_log.info("PARAM >>> " + "id: " + id);
  access_log.info("BODY >>> " + req.body);

  TrackingModel.getTrackingFromVehicle(id, req.body.initDate.toString(), req.body.endDate.toString(), function (error, data) {
    if (data == null) {
      res.status(200).json({ "response": { "status": 0,  "count": 0, "data": [] } } );
    }
    else if (typeof data !== 'undefined') {
      res.status(200).json({ "response": { "status": 0, "count": data.length,  "data": data } } );
    }
    //en otro caso se muestra error
    else {
      res.status(202).json({ "response": { "status": status.STATUS_FAILURE, "description": messages.DB_ERROR } })
    }
  });
});










module.exports = router;
