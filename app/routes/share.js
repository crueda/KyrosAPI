var express = require('express');
var router = express.Router();

var status = require("../utils/statusCodes.js");
var messages = require("../utils/statusMessages.js");

// Fichero de propiedades
var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('kyrosapi.properties');

var ShareModel = require('../models/share');

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


router.get('/share/vehicle/:vehicleLicense', function(req, res)
{
    if (req.session.user == null){
      res.redirect('/');
    } 
    else {
      var vehicleLicense = req.params.vehicleLicense;
      var username = req.session.user.username;
      var email = req.query.email;
      log.info("GET: /share/vehicle/"+vehicleLicense);

      var requestData = {
        username: username,
        vehicleLicense: vehicleLicense,
        email: email
      }

      ShareModel.addSharing(requestData,function(error, data)
      {
          if (data == null) {
            res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
          }
          else {
              res.status(200).json(data);
          }
          
      }); 
       
    }
});

module.exports = router;