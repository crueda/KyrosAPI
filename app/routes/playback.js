var status = require("../utils/statusCodes.js");
var messages = require("../utils/statusMessages.js");
var express = require('express');
var router = express.Router();
var playbackModel = require('../models/playback');

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

router.get('/playback/:token', function (req, res) {
  var token = req.params.token;

  log.info("GET: /playback/" + token);
  access_log.info("PARAM >>> " + "token: " + token);
  access_log.info("BODY >>> " + req.body);

  playbackModel.getKmlFromToken(token, function (error, data) {
    if (typeof data !== 'undefined') {
      res.status(200).send(data);
    }
    else {
      res.status(200).send("");
    }
  });
});

module.exports = router;
