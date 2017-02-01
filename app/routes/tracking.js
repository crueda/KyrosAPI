var express = require('express');
var router = express.Router();

var status = require("../utils/statusCodes.js");
var messages = require("../utils/statusMessages.js");

// Fichero de propiedades
var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('kyrosapi.properties');

var TrackingModel = require('../models/tracking');

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
 * @api {get} /api/tracking1/user/:username Últimas posiciones de los dispositivos de un username
 * @apiName GetTracking1User Obtener información de último tracking de todos los dispositivos de un usuario
 * @apiGroup Tracking
 * @apiDescription Datos del último tracking para todos los dispositivos monitorizados por el usuario
 * @apiVersion 1.0.1
 * @apiSampleRequest http://view.kyroslbs.com/api/tracking1/user/crueda
 *
 * @apiParam {String} username Nombre de usuario en Kyros
 *
 * @apiSuccess {json} trackingData Datos de último tracking
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *      [{"_id":399,
 *        "deviceId":399,
 *        "longitude":-4.72811,
 *        "latitude":41.6283,
 *        "speed":21.1,
 *        "heading":0,
 *        "pos_date":1346336184000,
 *        "iconReal":"truck.png",
 *        "iconCover":"truck_cover.png",
 *        "iconAlarm":"truck_alarm.png",
 *        "monitor":["flaa","crueda"],
 *        "license":"Bici_Rohm",
 *        "alias":"Bici rohm",
 *        "vehicle_state":"0"
 *        }]
 *     }
 */
router.get('/tracking1/user/:username', function(req, res)
{
    if (req.session.user == null){
      res.redirect('/');
    }
    else {
      var username = req.params.username;
      log.info("GET: /tracking1/user/"+username);

      TrackingModel.getTracking1FromUser(username,function(error, data)
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
            res.status(200).json(data)
          }
          else if (typeof data == 'undefined' || data.length == 0)
          {
            res.status(200).json([])
          }
          //en otro caso mostramos un error
          else
          {
            res.status(202).json({"response": {"status":status.STATUS_NOT_FOUND_REGISTER,"description":messages.MISSING_REGISTER}})
          }
        }
      });
    }
});

/**
 * @api {get} /api/tracking1/vehicle/:vehicleLicense Última posición de un vehiculo
 * @apiName GetTracking1Vehicle Obtener información de último tracking de un vehiculo
 * @apiGroup Tracking
 * @apiDescription Datos del último tracking de un vehiculo
 * @apiVersion 1.0.2
 * @apiSampleRequest http://view.kyroslbs.com/api/tracking1/vehicle/1615-FDW
 *
 * @apiParam {String} vehicleLicense Identificador del vehiculo en Kyros
 *
 * @apiSuccess {json} trackingData Datos de último tracking
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *      "_id" : ObjectId("57f3fd5efbb7137a40b5fa60"),
 *      "pos_date" : NumberLong(1475600701000),
 *      "battery" : 88,
 *      "altitude" : 726,
 *      "heading" : 306,
 *      "location" : {
 *        "type" : "Point",
 *        "coordinates" : [
 *           -4.713148,
 *           41.655135
 *        ]
 *      },
 *      "tracking_id" : 35815375,
 *      "vehicle_license" : "1615-FDW",
 *      "geocoding" : "",
 *      "events" : [],
 *      "device_id" : 13
 *    }
 */
router.get('/tracking1/vehicle/:vehicleLicense', function(req, res)
{
    if (req.session.user == null){
      res.redirect('/');
    }
    else {
      var vehicleLicense = req.params.vehicleLicense;
      log.info("GET: /tracking1/vehicle/"+vehicleLicense);

      TrackingModel.getTracking1FromVehicle(vehicleLicense,function(error, data)
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
            res.status(200).json(data)
          }
          else if (typeof data == 'undefined' || data.length == 0)
          {
            res.status(200).json([])
          }
          //en otro caso mostramos un error
          else
          {
            res.status(202).json({"response": {"status":status.STATUS_NOT_FOUND_REGISTER,"description":messages.MISSING_REGISTER}})
          }
        }
      });
    }
});

/**
 * @api {get} /api/tracking1 Últimas posiciones de los vehiculos (ordenadas por fecha)
 * @apiName GetTracking1 Obtener información de último tracking de todos los vehiculos
 * @apiGroup Tracking
 * @apiDescription Datos del último tracking para todos los vehiculos
 * @apiVersion 1.0.2
 * @apiSampleRequest http://view.kyroslbs.com/api/tracking1
 *
 * @apiSuccess {json} trackingData Datos de último tracking
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *     [{
 *      "_id" : ObjectId("57f3fd5efbb7137a40b5fa60"),
 *      "pos_date" : NumberLong(1475600701000),
 *      "battery" : 88,
 *      "altitude" : 726,
 *      "heading" : 306,
 *      "location" : {
 *        "type" : "Point",
 *        "coordinates" : [
 *           -4.713148,
 *           41.655135
 *        ]
 *      },
 *      "tracking_id" : 35815375,
 *      "vehicle_license" : "1615-FDW",
 *      "geocoding" : "",
 *      "events" : [],
 *      "device_id" : 13
 *     }]
 *     }
 */
router.get('/tracking1', function(req, res)
{
    if (req.session.user == null){
      res.redirect('/');
    }
    else {
        TrackingModel.getTracking1(function(error, data)
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
              res.status(200).json(data)
            }
            else if (typeof data == 'undefined' || data.length == 0)
            {
              res.status(200).json([])
            }
            //en otro caso mostramos un error
            else
            {
              res.status(202).json({"response": {"status":status.STATUS_NOT_FOUND_REGISTER,"description":messages.MISSING_REGISTER}})
            }
          }
        });

    }
});


/**
 * @api {get} /api/tracking1/vehicles Últimas posiciones de los vehiculos que se indican por parámetro
 * @apiName GetTracking1Vehicles Obtener información de último tracking de todos los vehiculos indicados
 * @apiGroup Tracking
 * @apiDescription Datos del último tracking para todos los vehiculos indicados
 * @apiVersion 1.0.2
 * @apiSampleRequest http://view.kyroslbs.com/api/tracking1/vehicles?vehicleLicenseList=651,652,655
 *
 * @apiParam {String} vehicleLicenseList Lista de matriculas separadas por comas
 *
 * @apiSuccess {json} trackingData Datos de último tracking
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *     [{
 *      "_id" : ObjectId("57f3fd5efbb7137a40b5fa60"),
 *      "pos_date" : NumberLong(1475600701000),
 *      "battery" : 88,
 *      "altitude" : 726,
 *      "heading" : 306,
 *      "location" : {
 *        "type" : "Point",
 *        "coordinates" : [
 *           -4.713148,
 *           41.655135
 *        ]
 *      },
 *      "tracking_id" : 35815375,
 *      "vehicle_license" : "1615-FDW",
 *      "geocoding" : "",
 *      "events" : [],
 *      "device_id" : 13
 *     }]
 *     }
 */
router.get('/tracking1/vehicles', function(req, res)
{
    if (req.session.user == null){
      res.redirect('/');
    }
    else {
      var vehicleLicenseList = req.query.vehicleLicenseList;
      log.info("GET: /tracking1/vehicles?vehicleLicenseList="+vehicleLicenseList);
      if (vehicleLicenseList==null) {
        res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
      }
      else {
        TrackingModel.getTracking1FromVehicles(vehicleLicenseList,function(error, data)
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
              res.status(200).json(data)
            }
            else if (typeof data == 'undefined' || data.length == 0)
            {
              res.status(200).json([])
            }
            //en otro caso mostramos un error
            else
            {
              res.status(202).json({"response": {"status":status.STATUS_NOT_FOUND_REGISTER,"description":messages.MISSING_REGISTER}})
            }
          }
        });
      }
    }
});

router.get('/tracking1radio', function(req, res)
{
    if (req.session.user == null){
      res.redirect('/');
    }
    else {
      var latitude = req.query.latitude;
      var longitude = req.query.longitude;
      var radio = req.query.radio;
      log.info("GET: /tracking1radio?latitude="+latitude+"&longitude="+longitude+"&radio="+radio);
      if (latitude==null || longitude==null || radio==null) {
        res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
      }
      else {
        TrackingModel.getTracking1Radio(latitude, longitude, radio,function(error, data)
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
              res.status(200).json(data)
            }
            else if (typeof data == 'undefined' || data.length == 0)
            {
              res.status(200).json([])
            }
            //en otro caso mostramos un error
            else
            {
              res.status(202).json({"response": {"status":status.STATUS_NOT_FOUND_REGISTER,"description":messages.MISSING_REGISTER}})
            }
          }
        });
      }
    }
});

/**
 * @api {get} /api/last-trackings/vehicle/:vehicleLicense Últimas posiciones de un vehiculo
 * @apiName GetLastTrackingsVehicle Obtener información los últimos trackings de un vehiculo
 * @apiGroup Tracking
 * @apiDescription Datos de los últimos puntos de tracking de un vehiculo
 * @apiVersion 1.0.2
 * @apiSampleRequest http://view.kyroslbs.com/api/trackings/vehicle/1615-FDW?ntrackings=5
 *
 * @apiParam {String} vehicleLicense Identificador del vehiculo en Kyros
 * @apiParam {Number} ntrackings Número de posiciones d etracking
 *
 * @apiSuccess {json} trackingData Datos de los últimos puntos de tracking
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *     [{
 *      "_id" : ObjectId("57f3fd5efbb7137a40b5fa60"),
 *      "pos_date" : NumberLong(1475600701000),
 *      "battery" : 88,
 *      "altitude" : 726,
 *      "heading" : 306,
 *      "location" : {
 *        "type" : "Point",
 *        "coordinates" : [
 *           -4.713148,
 *           41.655135
 *        ]
 *      },
 *      "tracking_id" : 35815375,
 *      "vehicle_license" : "1615-FDW",
 *      "geocoding" : "",
 *      "events" : [],
 *      "device_id" : 13
 *     }, {......}, .... ]
 *     }
 */
router.get('/last-trackings/vehicle/:vehicleLicense', function(req, res)
{
    if (req.session.user == null){
      res.redirect('/');
    }
    else {
      var vehicleLicense = req.params.vehicleLicense;

      var ntrackings = req.query.ntrackings;

      if (ntrackings==null) {
        res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
      }
      else {
        log.info("GET: /last-trackings/vehicle/?ntrackings="+ntrackings);

        var requestData = {
          vehicleLicense : vehicleLicense,
          ntrackings : ntrackings
        };
        TrackingModel.getLastTrackingsFromVehicle(requestData,function(error, data)
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
              res.status(200).json(data)
            }
            else if (typeof data == 'undefined' || data.length == 0)
            {
              res.status(200).json([])
            }
            //en otro caso mostramos un error
            else
            {
              res.status(202).json({"response": {"status":status.STATUS_NOT_FOUND_REGISTER,"description":messages.MISSING_REGISTER}})
            }
          }
        });
      }
    }
});

/**
 * @api {get} /api/tracking/vehicle/:vehicleLicense Posiciones de un vehiculo
 * @apiName GetTrackingVehicle Obtener información de tracking de un vehiculo
 * @apiGroup Tracking
 * @apiDescription Datos de tracking de un vehiculo entre 2 fechas
 * @apiVersion 1.0.2
 * @apiSampleRequest http://view.kyroslbs.com/api/tracking/vehicle/1615-FDW?initDate=1473829136000&endDate=1473915536000
 *
 * @apiParam {String} vehicleLicense Identificador del vehiculo en Kyros
 * @apiParam {Number} initDate Fecha inicial (epoch)
 * @apiParam {Number} endDate Fecha final (epoch)
 *
 * @apiSuccess {json} trackingData Datos de todos los puntos de tracking entre esas fechas
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *     [{
 *      "_id" : ObjectId("57f3fd5efbb7137a40b5fa60"),
 *      "pos_date" : NumberLong(1475600701000),
 *      "battery" : 88,
 *      "altitude" : 726,
 *      "heading" : 306,
 *      "location" : {
 *        "type" : "Point",
 *        "coordinates" : [
 *           -4.713148,
 *           41.655135
 *        ]
 *      },
 *      "tracking_id" : 35815375,
 *      "vehicle_license" : "1615-FDW",
 *      "geocoding" : "",
 *      "events" : [],
 *      "device_id" : 13
 *     }, {......}, .... ]
 *     }
 */
router.get('/tracking/vehicle/:vehicleLicense', function(req, res)
{
    if (req.session.user == null){
      res.redirect('/');
    }
    else {
      var vehicleLicense = req.params.vehicleLicense;
      var initDate = req.query.initDate;
      var endDate = req.query.endDate;

      log.info("GET: /tracking/vehicle/"+vehicleLicense);

      if (initDate==null || endDate==null) {
        res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
      }
      else {
        var requestData = {
          vehicleLicense : vehicleLicense,
          initDate : initDate,
          endDate : endDate
        };
        TrackingModel.getTrackingFromVehicleAndDate(requestData, function(error, data)
        {
          if (data == null)
          {
            res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
          }
          else
          {
            //si existe enviamos el json
            if (typeof data !== 'undefined' && data.length > 6999)
            {
              res.status(200).json({"status": "nok", "result": data});
            }
            else if (typeof data !== 'undefined' && data.length > 0)
            {
              res.status(200).json({"status": "ok", "result": data});
            }
            else if (typeof data == 'undefined' || data.length == 0)
            {
              res.status(200).json({"status": "ok", "result": []});
              //res.status(200).json([])
            }
            //en otro caso mostramos un error
            else
            {
              res.status(202).json({"response": {"status":status.STATUS_NOT_FOUND_REGISTER,"description":messages.MISSING_REGISTER}})
            }
          }
        });
      }
    }
});


/**
 * @api {get} /api/tracking Información de una posición de un vehiculo
 * @apiName GetTracking Obtener información de una posición
 * @apiGroup Tracking
 * @apiDescription Datos de la posición de un vehiculo
 * @apiVersion 1.0.1
 * @apiSampleRequest http://view.kyroslbs.com/api/tracking?vehicleLicense&trackingId=35635027
 *
 * @apiParam {String} vehicleLicense Identificador del vehiculo en Kyros
 * @apiParam {Number} trackingId Identificador de la posición
 *
 * @apiSuccess {json} trackingData Datos del punto de tracking
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *      "_id" : ObjectId("57f3fd5efbb7137a40b5fa60"),
 *      "pos_date" : NumberLong(1475600701000),
 *      "battery" : 88,
 *      "altitude" : 726,
 *      "heading" : 306,
 *      "location" : {
 *        "type" : "Point",
 *        "coordinates" : [
 *           -4.713148,
 *           41.655135
 *        ]
 *      },
 *      "tracking_id" : 35815375,
 *      "vehicle_license" : "1615-FDW",
 *      "geocoding" : "",
 *      "events" : [],
 *      "device_id" : 13
 *     }
 */
router.get('/tracking', function(req, res)
{
    if (req.session.user == null){
      res.redirect('/');
    }
    else {
      var vehicleLicense = req.query.vehicleLicense;
      var trackingId = req.query.trackingId;

      if (vehicleLicense==null || trackingId==null) {
        res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
      }
      else {
        log.info("GET: /tracking?vehicleLicense="+vehicleLicense+"&trackingId="+trackingId);
        var requestData = {
          vehicleLicense : vehicleLicense,
          trackingId : trackingId
        };
        TrackingModel.getTrackingFromVehicle(requestData, function(error, data)
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
              res.status(200).json(data)
            }
            else if (typeof data == 'undefined' || data.length == 0)
            {
              res.status(200).json([])
            }
            //en otro caso mostramos un error
            else
            {
              res.status(202).json({"response": {"status":status.STATUS_NOT_FOUND_REGISTER,"description":messages.MISSING_REGISTER}})
            }
          }
        });
      }
    }
});

module.exports = router;
