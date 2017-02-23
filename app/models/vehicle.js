var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('kyrosapi.properties');
var mongoose = require('mongoose');
var moment = require("moment");

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

var dbMongoName = properties.get('bbdd.mongo.name');
var dbMongoHost = properties.get('bbdd.mongo.ip');
var dbMongoPort = properties.get('bbdd.mongo.port');

mongoose.connect('mongodb://' + dbMongoHost + ':' + dbMongoPort + '/' + dbMongoName,  { server: { reconnectTries: 3, poolSize: 5 } }, function (error) {
  if (error) {
    log.info(error);
  }
});

var vehicleModel = {};

vehicleModel.getVehicles = function (username, callback) {
  vehicleModel.getVehiclesFromUsername(username, function (error, monitor_vehicle) {
    mongoose.connection.db.collection('VEHICLE', function (err, collection) {
      collection.find({"device_id": {$in: monitor_vehicle}}, { _id: 0, icon_real_time: 0, icon_alarm: 0, icon_cover: 0, consumption: 0, vehicle_license_order: 0}).toArray(function (err, docs) {
          callback(null, docs);
      });
    });
  });
}

vehicleModel.getVehicle = function (id, callback) {
  mongoose.connection.db.collection('VEHICLE', function (err, collection) {
    collection.find({ 'device_id': parseInt(id) }, { _id: 0, icon_real_time: 0, icon_alarm: 0, icon_cover: 0, consumption: 0, vehicle_license_order: 0}).toArray(function (err, docs) {
        callback(null, docs);
    });
  });
}


vehicleModel.getVehiclesFromUsername = function (username, callback) {
  mongoose.connection.db.collection('USER', function (err, collection) {
    collection.find({ 'username': username }).toArray(function (err, docs) {
      if (docs[0] == undefined || docs[0].monitor_vehicle == undefined) {
        callback(null, []);
      } else {
        callback(null, docs[0].monitor_vehicle);
      }
    });
  });
}

vehicleModel.setAsDefault = function(username, vehicleLicense, callback)
{
    mongoose.connection.db.collection('USER', function (err, collection) {
        collection.find({'username': username}).toArray(function(err, docs) {
            if (docs[0]!=undefined) {
                docs[0].vehicle_license = vehicleLicense;
                collection.save(docs[0]);
                callback(null, docs);
            } else {
                callback(null, []);
            }
        });
    });
}

/*
vehicleModel.getVehiclesArea = function (username, areaId, timestamp, callback) {
  vehicleModel.getVehiclesFromUsername(username, function (error, monitor_vehicle) {

    mongoose.connection.db.collection('AREA', function (err, collection) {
      collection.find({"id": areaId}).toArray(function (err, docsArea) {
        if (docsArea[0]!=undefined) {
          mongoose.connection.db.collection('TRACKING', function (err, collection) {
            collection.find({ 'location': {$geoWithin: {$box:docsArea[0].location.coordinates}} }).toArray(function (err, docsTracking) {
                var docsResult = [];
                for (var i=0; i<docsTracking.length; i++) {
                }
                callback(null, docsResult);
            });
          });
        } else {
          callback(null, []);
        }

      });
    });

  });
}
*/

//exportamos el objeto para tenerlo disponible en la zona de rutas
module.exports = vehicleModel;
