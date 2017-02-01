var server = require('mongodb').Server;
var mongoose = require('mongoose');

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

mongoose.connect('mongodb://' + dbMongoHost + ':' + dbMongoPort + '/' + dbMongoName, function (error) {
    if (error) {
        log.info(error);
    }
});

// Crear un objeto para ir almacenando todo lo necesario
var vehicleModel = {};

vehicleModel.getVehicles = function(callback)
{
    mongoose.connection.db.collection('VEHICLE', function (err, collection) {
        collection.find().toArray(function(err, docs) {
            callback(null, docs);
        });
    });

}

vehicleModel.getVehicle = function(vehicleLicense, callback)
{
    mongoose.connection.db.collection('VEHICLE', function (err, collection) {
        collection.find({"vehicle_license" : vehicleLicense}).toArray(function(err, docs) {
            callback(null, docs);
        });
  });
}

vehicleModel.setAsDefault = function(username, vehicleLicense, callback)
{
    mongoose.connection.db.collection('USER', function (err, collection) {
        //collection.find({'id': parseInt(notificationId)}).limit(1).toArray(function(err, docs) {
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

//exportamos el objeto para tenerlo disponible en la zona de rutas
module.exports = vehicleModel;
