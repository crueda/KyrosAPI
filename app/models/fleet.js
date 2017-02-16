var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('kyrosapi.properties');
var mongoose = require('mongoose');

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

var dbConfig = {
  host: properties.get('bbdd.mysql.ip'),
  user: properties.get('bbdd.mysql.user'),
  password: properties.get('bbdd.mysql.passwd'),
  database: properties.get('bbdd.mysql.name'),
  connectionLimit: 50,
  queueLimit: 0,
  waitForConnection: true
};

// Crear la conexion a la base de datos
var mysql = require('mysql');
var pool = mysql.createPool(dbConfig);

var dbMongoName = properties.get('bbdd.mongo.name');
var dbMongoHost = properties.get('bbdd.mongo.ip');
var dbMongoPort = properties.get('bbdd.mongo.port');

mongoose.connect('mongodb://' + dbMongoHost + ':' + dbMongoPort + '/' + dbMongoName, function (error) {
  if (error) {
    log.info(error);
  }
});

// Crear un objeto para ir almacenando todo lo necesario
var fleetModel = {};

// Obtener las flotas del usuario
fleetModel.getFleets = function (username, callback) {
  fleetModel.getFleetsFromUsername(username, function (error, monitor_fleet) {
    mongoose.connection.db.collection('FLEET', function (err, collection) {
        collection.find({"id": {$in: monitor_fleet}}, { _id: 0}).toArray(function (err, docs) {
            callback(null, docs);
        });
      });
  });
}

// Obtener un fleet por su id
fleetModel.getFleet = function (id, callback) {
  mongoose.connection.db.collection('FLEET', function (err, collection) {
    collection.find({ 'id': id }, { _id: 0}).toArray(function (err, docs) {
        callback(null, docs);
    });
  });
}


fleetModel.getFleetsFromUsername = function (username, callback) {
  mongoose.connection.db.collection('USER', function (err, collection) {
    collection.find({ 'username': username }).toArray(function (err, docs) {
      if (docs[0] == undefined || docs[0].monitor_fleet == undefined) {
        callback(null, []);
      } else {
        callback(null, docs[0].monitor_fleet);
      }
    });
  });
}

//exportamos el objeto para tenerlo disponible en la zona de rutas
module.exports = fleetModel;
