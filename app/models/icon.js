var server = require('mongodb').Server;
var mongoose = require('mongoose');

var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('kyrosapi.properties');

var ObjectId = require('mongoose').Types.ObjectId;

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

//mongoose.createConnection('mongodb://' + dbMongoHost + ':' + dbMongoPort + '/' + dbMongoName, function (error) {
mongoose.connect('mongodb://' + dbMongoHost + ':' + dbMongoPort + '/' + dbMongoName,  { server: { reconnectTries: 3, poolSize: 5 } }, function (error) {
    if (error) {
        log.info(error);
    }
});

// Crear un objeto para ir almacenando todo lo necesario
var iconModel = {};

iconModel.getIcon = function(id, callback)
{
  mongoose.connection.db.collection('ICON', function (err, collection) {
      collection.find({'_id': new ObjectId(id)}).toArray(function(err, docs) {
            callback(null, docs);
      });
  });
}

iconModel.getIcons = function(subtypeList, callback)
{
  var subtypeArray = subtypeList.split(',');
  var subtypeArrayInt = [];
  for (var i=0; i<subtypeArray.length; i++) {
    try {
      subtypeArrayInt.push(parseInt(subtypeArray[i]));
    } catch (err) {}
  }

  mongoose.connection.db.collection('ICON', function (err, collection) {
      collection.find({'subtype': {$in: subtypeArrayInt}}).toArray(function(err, docs) {
            callback(null, docs);
      });
  });
}

iconModel.getAllIconInfo = function(callback)
{
  mongoose.connection.db.collection('ICON', function (err, collection) {
      collection.find({},{'svg': 0}).toArray(function(err, docs) {
          callback(null, docs);
      });
  });
}

iconModel.getAllEventIcons = function(callback)
{
  mongoose.connection.db.collection('ICON', function (err, collection) {
      collection.find({'type': 1}).toArray(function(err, docs) {
          callback(null, docs);
      });
  });
}

iconModel.getAllVehicleIcons = function(callback)
{
  mongoose.connection.db.collection('ICON', function (err, collection) {
      collection.find({'type': 2}).toArray(function(err, docs) {
          callback(null, docs);
      });
  });
}

//exportamos el objeto para tenerlo disponible en la zona de rutas
module.exports = iconModel;
