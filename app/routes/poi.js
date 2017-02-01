var express = require('express');
var router = express.Router();

var status = require("../utils/statusCodes.js");
var messages = require("../utils/statusMessages.js");

// Fichero de propiedades
var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('kyrosapi.properties');

var PoiModel = require('../models/poi');

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
 * @api {get} /api/poi/box  Todos los POIs que se encuentren dentro de la caja
 * @apiName GetPoiBox Obtener todos los POIs que se encuentren dentro de la caja
 * @apiGroup Poi
 * @apiDescription Obtiene los POIs dentro de la caja indicada por parametro
 * @apiVersion 1.0.1
 * @apiSampleRequest http://view.kyroslbs.com/api/poi/box?username=crueda&ullon=-6.19&ullat=42.34&drlon=-5.04&drlat=41.75
 *
 * @apiParam {String} username Nombre de usuario en Kyros
 * @apiParam {Number} ullon Longitud de la esquina superior izquierda
 * @apiParam {Number} ullat Latitud de la esquina superior izquierda
 * @apiParam {Number} drlon Longitud de la esquina inferior derecha
 * @apiParam {Number} drlat Latitude de la esquina inferior derecha
 *
 * @apiSuccess {json} poisData Datos de los POIs
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *      
 *     }
 */
router.get('/poi/box/', function(req, res)
{
    if (req.session.user == null){
      res.redirect('/');
    } 
    else {
      log.info("GET: /poi/box");
      var username = req.query.username;
      var ullon = req.query.ullon;
      var ullat = req.query.ullat;
      var drlon = req.query.drlon;
      var drlat = req.query.drlat;

      var boxData = {
          username : username,
          ullon : ullon,
          ullat : ullat,
          drlon : drlon,
          drlat : drlat
        };
      if (username==null || ullon==null || ullat==null || drlon==null || drlat==null) {
        res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
      } 
      else {
        PoiModel.getPoisFromBox(boxData,function(error, data)
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
 * @api {get} /api/poi/radio  Todos los POIs que se encuentren dentro de un radio
 * @apiName GetPoiRadio Obtener todos los POIs que se encuentren dentro de un radio
 * @apiGroup Poi
 * @apiDescription Obtiene los POIs dentro del círculo pasado por parametro (centro y radio)
 * @apiVersion 1.0.1
 * @apiSampleRequest http://view.kyroslbs.com/api/poi/radio?username=crueda&longitude=-6.19&latitude=42.34&radio=100
 *
 * @apiParam {String} username Nombre de usuario en Kyros
 * @apiParam {Number} longitude Longitud del punto central del círculo
 * @apiParam {Number} latitude Latitud del punto central del círculo
 * @apiParam {Number} radio Radio (en metros) del cículo
 *
 * @apiSuccess {json} poisData Datos de los POIs
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *      
 *     }
 */
router.get('/poi/radio/', function(req, res)
{
    if (req.session.user == null){
      res.redirect('/');
    } 
    else {
      log.info("GET: /poi/radio");
      var username = req.query.username;
      var longitude = req.query.longitude;
      var latitude = req.query.latitude;
      var radio = req.query.radio;

      if (username==null || longitude==null || latitude==null || radio==null) {
        res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
      } 
      else {
        PoiModel.getPoisFromRadio(username, latitude, longitude, radio, function(error, data)
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