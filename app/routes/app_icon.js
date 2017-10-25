var express = require('express');
var router = express.Router();

var status = require("../utils/statusCodes.js");
var messages = require("../utils/statusMessages.js");

// Fichero de propiedades
var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('kyrosapi.properties');

var IconModel = require('../models/icon');

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

router.get('/icon/:id', function(req, res)
{
  var id = req.params.id;

  log.info("GET: /icon/"+id);
  IconModel.getIcon(id, function(error, data) {
    if (data == null) {
      res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
    }
    else {
      //si existe enviamos el json
      if (data !== 'undefined') {
        res.status(200).json(data)
      } else {
        res.status(202).json({"response": {"status":status.STATUS_NOT_FOUND_REGISTER,"description":messages.MISSING_REGISTER}})
      }
    }
  });
});

router.get('/allicons', function(req, res)
{
  log.info("GET: /allicons");

  var type = req.query.type;

  if (type==null) {
    res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
  }
  else {
    if (type=='1') {
      IconModel.getAllEventIcons(function(error, data) {
        if (data == null) {
          res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
        }
        else {
            //si existe enviamos el json
            if (data !== 'undefined') {
              res.status(200).json(data)
            } else {
              res.status(202).json({"response": {"status":status.STATUS_NOT_FOUND_REGISTER,"description":messages.MISSING_REGISTER}})
            }
        }
      });
    }
    else if (type=='2') {
      IconModel.getAllVehicleIcons(function(error, data) {
        if (data == null) {
          res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
        }
        else {
            //si existe enviamos el json
            if (data !== 'undefined') {
              res.status(200).json(data)
            } else {
              res.status(202).json({"response": {"status":status.STATUS_NOT_FOUND_REGISTER,"description":messages.MISSING_REGISTER}})
            }
        }
      });
    } else {
      res.status(200).json([]);
    }
  }
});

router.get('/icons', function(req, res)
{
  var subtypeList = req.query.subtypeList;

  log.info("GET: /icons?subtypeList="+subtypeList);
  if (subtypeList==null) {
    res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
  }
  else {
    IconModel.getIcons(subtypeList, function(error, data) {
    if (data == null) {
      res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
    }
    else {
      //si existe enviamos el json
      if (data !== 'undefined') {
        res.status(200).json(data)
      } else {
        res.status(202).json({"response": {"status":status.STATUS_NOT_FOUND_REGISTER,"description":messages.MISSING_REGISTER}})
      }
    }
    });
  }
});

router.get('/iconInfo', function(req, res)
{
  log.info("GET: /iconInfo");
  IconModel.getAllIconInfo(function(error, data) {
    if (data == null) {
      res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
    }
    else {
      //si existe enviamos el json
      if (data !== 'undefined') {
        res.status(200).json(data)
      } else {
        res.status(202).json({"response": {"status":status.STATUS_NOT_FOUND_REGISTER,"description":messages.MISSING_REGISTER}})
      }
    }
  });
});

module.exports = router;
