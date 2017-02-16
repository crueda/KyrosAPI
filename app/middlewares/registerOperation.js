var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('kyrosapi.properties');

var ApiModel = require('../models/api');

// Definición del log
var fs = require('fs');
var log = require('tracer').console({
    transport: function (data) {
        //console.log(data.output);
        fs.open(properties.get('main.log.file'), 'a', 0666, function (e, id) {
            fs.write(id, data.output + "\n", null, 'utf8', function () {
                fs.close(id, function () {
                });
            });
        });
    }
});

module.exports = function(req, res, next) {

   try {
      ApiModel.registerOperation(req.method,function(error, data) {
        next();
      });

    } catch (err) {
        log.error("ERROR: "+err);
        next();
   }

}
