var express = require('express');
var router = express.Router();

var status = require("../utils/statusCodes.js");
var messages = require("../utils/statusMessages.js");

// Fichero de propiedades
var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('kyrosapi.properties');

var VehicleModel = require('../models/vehicle');

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
 * @api {get} /api/vehicles  Todos los vehiculos
 * @apiName GetVehicles Obtener los datos de todos los vehiculos
 * @apiGroup Vehicle
 * @apiDescription Obtiene los vehículos dados de alta en Kyros
 * @apiVersion 1.0.2
 * @apiSampleRequest http://view.kyroslbs.com/api/vehicles
 *
 * @apiSuccess {json} vehiclesData Datos de los vehículos
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *
 *     }
 */
router.get('/vehicles/', function(req, res)
{
    if (req.session.user == null){
      res.redirect('/');
    }
    else {
      log.info("GET: /vehicles");
      VehicleModel.getVehicles(function(error, data)
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
 * @api {get} /api/vehicle  Vehículo
 * @apiName GetVehicle Obtener los datos de un vehiculo
 * @apiGroup Vehicle
 * @apiDescription Obtiene un vehículo dado de alta en Kyros
 * @apiVersion 1.0.2
 * @apiSampleRequest http://view.kyroslbs.com/api/vehicle
 *
 * @apiSuccess {json} vehiclesData Datos de los vehículos
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *
 *     }
 */
router.get('/vehicle/:vehicleLicense', function(req, res)
{
    if (req.session.user == null){
      res.redirect('/');
    }
    else {
      var vehicleLicense = req.params.vehicleLicense;
      log.info("GET: /vehicle/"+vehicleLicense);

      VehicleModel.getVehicle(vehicleLicense,function(error, data)
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

module.exports = router;
