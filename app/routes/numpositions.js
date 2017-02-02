var express = require('express');
var router = express.Router();
var jsonfy = require('jsonfy');

var status = require("../utils/statusCodes.js");
var messages = require("../utils/statusMessages.js");

// Fichero de propiedades
var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('kyrosapi.properties');

var NumpositionsModel = require('../models/numpositions');

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

router.get('/numpositions/:vehicleLicense', function(req, res)
{
    if (req.session.user == null){
      res.redirect('/');
    } 
    else {
      var vehicleLicense = req.params.vehicleLicense;
      var initDate = req.query.initDate;
      var endDate = req.query.endDate;
      var slots = req.query.slots;

      log.info("GET: /numpositions/"+vehicleLicense);

      if (endDate==null) {
        endDate = (new Date).getTime()
      }
      if (slots==null) {
        slots = 10;
      }

      if (initDate==null) {
        res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
      } 
      else {
        var requestData = {
          vehicleLicense : vehicleLicense,
          initDate : initDate,
          endDate : endDate,
          slots: slots
        };
        NumpositionsModel.getNumpositions(requestData, function(error, data)
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
              res.status(200).json(jsonfy(data))
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

/*
 * @api {get} /api/numpositionsGroupByHeading/:vehicleLicense Número de posiciones de un dispositivo agrupadas por rango de heading
 * @apiName GetNumPositionsHeading Obtener información del número de posiciones de un determinado dispositivo
 * @apiGroup Numpositions
 * @apiDescription Datos del número de posiciones de un determinado dispositivo, agrupadas por rango de heading cada 45º
 * @apiVersion 1.0.1
 * @apiSampleRequest http://view.kyroslbs.com/api/numpositionsGroupByHeading/655?initDate=1473915536000&?endDate=1473915736000
 *
 * @apiParam {String} vehicleLicense Identificador del dispositivo en Kyros
 * @apiParam {Number} initDate Fecha inicial de consulta (epoch)
 * @apiParam {Number} [endDate] Fecha final de consulta (epoch)
 *
 * @apiSuccess {json} numpositionsData Datos del número de posiciones
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *      "dataset": {
 *         "data": [8, 7, 6, 5, 4, 3, 2, 1], 
 *      }
 *     }
 */
router.get('/numpositionsGroupByHeading/:vehicleLicense', function(req, res)
{
    if (req.session.user == null){
      res.redirect('/');
    } 
    else {
      var vehicleLicense = req.params.vehicleLicense;
      var initDate = req.query.initDate;
      var endDate = req.query.endDate;

      log.info("GET: /numpositionsGroupByHeading/"+vehicleLicense);

      if (endDate==null) {
        endDate = (new Date).getTime()
      }

      if (initDate==null) {
        res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
      } 
      else {
        var requestData = {
          vehicleLicense : vehicleLicense,
          initDate : initDate,
          endDate : endDate
        };
        NumpositionsModel.getNumpositionsGroupByHeading(requestData, function(error, data)
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
              res.status(200).json(jsonfy(data))
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