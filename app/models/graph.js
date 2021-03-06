var server = require('mongodb').Server;
var mongoose = require('mongoose');
var crypt     = require('crypt3');

var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('kyrosapi.properties');

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

mongoose.connect('mongodb://' + dbMongoHost + ':' + dbMongoPort + '/' + dbMongoName, { server: { reconnectTries: 3, poolSize: 5 } }, function (error) {
    if (error) {
        log.info(error);
    }
});

// Crear un objeto para ir almacenando todo lo necesario
var graphModel = {};

graphModel.getGraphData = function(deviceId, callback)
{
  /*function sortFunction(a, b) {
    if (a[0] === b[0]) {
        return 0;
    }
    else {
        return (a[0] < b[0]) ? -1 : 1;
    }
  }*/

  mongoose.connection.db.collection('ODOMETER', function (err, collection) {
      collection.find({'device_id': parseInt(deviceId)}).toArray(function(err, docs) {
          if (docs[0]!=undefined) {
            var events = [];
            for(var eventType in docs[0].eventTypeCounter) {
              events.push([eventType, docs[0].eventTypeCounter[eventType]]);
            }
            docs[0].eventTypeVector = events;
          }
          callback(null, docs);
      });
  });
}

graphModel.resetGraphData = function(deviceId, callback)
{
  mongoose.connection.db.collection('ODOMETER', function (err, collection) {
      collection.find({'device_id': parseInt(deviceId)}).toArray(function(err, docs) {
          if (docs[0]!=undefined) {
              var newOdemeterData = docs[0];
              newOdemeterData.weekTrackingCounter = {
                "monday" : 0,
                "tuesday" : 0,
                "friday" : 0,
                "wednesday" : 0,
                "thursday" : 0,
                "sunday" : 0,
                "saturday" : 0
              };
              newOdemeterData.weekEventCounter = {
                "monday" : 0,
                "tuesday" : 0,
                "friday" : 0,
                "wednesday" : 0,
                "thursday" : 0,
                "sunday" : 0,
                "saturday" : 0
              };
              newOdemeterData.eventTypeCounter = {};
              newOdemeterData.hourTrackingCounter = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
              newOdemeterData.hourEventCounter = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
              collection.save(newOdemeterData);
              callback(null, newOdemeterData);
            } else {
              callback(null, []);
            }
      });
  });
}

//exportamos el objeto para tenerlo disponible en la zona de rutas
module.exports = graphModel;
