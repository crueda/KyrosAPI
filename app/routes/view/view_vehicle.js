var express = require('express');
var router = express.Router();

var status = require("../../utils/statusCodes.js");
var messages = require("../../utils/statusMessages.js");

// Fichero de propiedades
var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('kyrosapi.properties');

var VehicleModel = require('../../models/vehicle');

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


router.get('/event/device/:id', function(req, res)
{
      var id = req.params.id;
      log.info("POST: /view/event/device/"+ id);

      VehicleModel.getLastEvents(id,function(error, data)
      {
          if (data == null)
          {
            res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
          }
          else
          {
            if (typeof data !== 'undefined' && data.length > 0)
            {
              res.status(200).json(data)
            }
            else if (typeof data == 'undefined' || data.length == 0)
            {
              res.status(200).json([])
            }
            else
            {
              res.status(202).json({"response": {"status":status.STATUS_NOT_FOUND_REGISTER,"description":messages.MISSING_REGISTER}})
            }
          }
      });

});

module.exports = router;
