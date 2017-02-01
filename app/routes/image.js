var express = require('express');
var router = express.Router();
var jsonfy = require('jsonfy');
var multer  =   require('multer');

var Busboy = require('busboy'); 
var mongo = require('mongodb'); 
var Grid = require('gridfs-stream'); 

//var gm = require('gm').subClass({imageMagick: true});

//var gm = require('gm');

var status = require("../utils/statusCodes.js");
var messages = require("../utils/statusMessages.js");

// Fichero de propiedades
var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('kyrosapi.properties');

var ImageModel = require('../models/image');

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

var dbMongoName = properties.get('bbdd.mongo.name');
var dbMongoHost = properties.get('bbdd.mongo.ip');
var dbMongoPort = properties.get('bbdd.mongo.port');

router.get('/image/vehicle/:vehicleLicense', function(req, res)
{
    //if (req.session.user == null){
    //  res.redirect('/');
    //} 
    //else {
      var vehicleLicense = req.params.vehicleLicense;

      log.info("GET: /image/vehicle/"+vehicleLicense);

      if (vehicleLicense==null) {
        res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
      } 
      else {
        ImageModel.getImageVehicle(vehicleLicense, function(error, data)
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
   // }
});

router.get('/icon/vehicle/:vehicleLicense', function(req, res)
{
    //if (req.session.user == null){
    //  res.redirect('/');
    //} 
    //else {
      var vehicleLicense = req.params.vehicleLicense;

      log.info("GET: /icon/vehicle/"+vehicleLicense);

      if (vehicleLicense==null) {
        res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
      } 
      else {
        ImageModel.getIconVehicle(vehicleLicense, function(error, data)
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
    //}
});

router.get('/icon/vehicles', function(req, res)
{
    if (req.session.user == null){
      res.redirect('/');
    } 
    else {
      var vehicleLicenseList = req.query.vehicleLicenseList;

      log.info("GET: /icon/vehicles?vehicleLicenseList="+vehicleLicenseList);

      if (vehicleLicenseList==null) {
        res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
      } 
      else {
        ImageModel.getIconVehicles(vehicleLicenseList, function(error, data)
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


var db = new mongo.Db(dbMongoName, new mongo.Server(dbMongoHost, dbMongoPort));
var gfs;
db.open(function(err, db) {
  if (err) throw err;
  gfs = Grid(db, mongo);
});

router.post('/image/upload/:vehicleLicense', function(req, res)
{
  if (req.session.user == null){
      res.redirect('/');
    } 
    else {
      var vehicleLicense = req.params.vehicleLicense;

      log.info("POST: /image/upload");

      if (vehicleLicense==null) {
          res.redirect('/map');
          //res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
      } 
      else {
        // Borrar los ficheros antiguos
        gfs.files.remove({filename:vehicleLicense} , function(err){
          if (err){
            log.error("error al borrar los ficheros antiguos");
          }else{
            log.debug("old file removed")
          }           
        }); 

        var busboy = new Busboy({ headers : req.headers });
        var fileId = new mongo.ObjectId();

        busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
          console.log('got file', vehicleLicense, mimetype, encoding);
          var writeStream = gfs.createWriteStream({
            _id: fileId,
            filename: vehicleLicense,
            mode: 'w',
            content_type: mimetype,
          });
          file.pipe(writeStream);
        }).on('finish', function() {
          res.redirect('/map');
        });

        req.pipe(busboy);
      }
    }
});

router.post('/icon/upload/:vehicleLicense', function(req, res)
{
  if (req.session.user == null){
      res.redirect('/');
    } 
    else {
      var vehicleLicense = req.params.vehicleLicense;

      log.info("POST: /icon/upload");

      if (vehicleLicense==null) {
          res.redirect('/map');
          //res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
      } 
      else {
        // Borrar los ficheros antiguos
        gfs.files.remove({filename:'icon_'+vehicleLicense} , function(err){
          if (err){
            log.error("error al borrar los ficheros antiguos");
          }else{
            log.debug("old icon file removed")
          }           
        }); 

        var busboy = new Busboy({ headers : req.headers });
        var fileId = new mongo.ObjectId();


        busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
          console.log('got file', 'icon_'+vehicleLicense, mimetype, encoding);
          /*
          file.on('limit', function() {
            //Clear variables
          });*/

          file.on('data', function(data) {
        console.log('File [' + fieldname + '] got ' + data.length + ' bytes');


      });

          // obtain the size of an image
          /*
          gm(file)
          .size(function (err, size) {
            if (!err) {
              console.log('width = ' + size.width);
              console.log('height = ' + size.height);
            }
          });*/


          var writeStream = gfs.createWriteStream({
            _id: fileId,
            filename: 'icon_'+vehicleLicense,
            mode: 'w',
            content_type: mimetype,
          });
          file.pipe(writeStream);
        }).on('finish', function() {
          res.redirect('/map');
          /*res.render('map.ejs', {
            msg: res.__('icon_updated'),
            msg_color: 'green',
            user : req.session.user.username,
            vehicleLicense : req.session.user.vehicleLicense
          });*/

        });

        req.pipe(busboy);
      }
    }
});

router.get('/icon/delete/:vehicleLicense', function(req, res)
{
  if (req.session.user == null){
      res.redirect('/');
    } 
    else {
      var vehicleLicense = req.params.vehicleLicense;

      log.info("POST: /icon/delete");

      if (vehicleLicense==null) {
          res.redirect('/map');
      } 
      else {
        // Borrar los ficheros antiguos
        gfs.files.remove({filename:'icon_'+vehicleLicense} , function(err){
          if (err){
            log.error("error al borrar los ficheros antiguos");
          }else{
            log.debug("old icon file removed")
          }           
        }); 
      }
    }
});

module.exports = router;