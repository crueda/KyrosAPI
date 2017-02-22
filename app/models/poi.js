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

mongoose.connect('mongodb://' + dbMongoHost + ':' + dbMongoPort + '/' + dbMongoName,  { server: { reconnectTries: 3, poolSize: 5 } }, function (error) {
    if (error) {
        log.info(error);
    }
});

// Crear un objeto para ir almacenando todo lo necesario
var poiModel = {};

poiModel.getPois = function(username, callback)
{
    mongoose.connection.db.collection('POI', function (err, collection) {
        collection.find({'username': username}, {'_id':0, 'username':0, 'type': 0, 'icon': 0}).limit(100).toArray(function(err, docs) {
            callback(null, docs);
        });
    });
}

poiModel.getPoi = function(username, id, callback)
{
    mongoose.connection.db.collection('POIS', function (err, collection) {
        collection.find({'username': username, 'id': id}, {'_id':0,'username':0, 'type': 0, 'icon': 0}).toArray(function(err, docs) {
            callback(null, docs);
        });
    });
}


poiModel.getPoisFromBox = function(boxData,callback)
{
    mongoose.connection.db.collection('POI', function (err, collection) {
        log.info(boxData.ullon);
        log.info(boxData.ullat);
        log.info(boxData.drlon);
        log.info(boxData.drlat);
        //collection.find( { 'location' :{ $geoWithin :{ $box : [ [ parseFloat(boxData.ullon) , parseFloat(boxData.ullat) ] ,[ parseFloat(boxData.drlon) , parseFloat(boxData.drlat) ]]}}}).toArray(function(err, docs) {
        collection.find( { 'username': boxData.username, 'location' :{ $geoWithin :{ $box : [ [ parseFloat(boxData.ullon) , parseFloat(boxData.ullat) ] ,[ parseFloat(boxData.drlon) , parseFloat(boxData.drlat) ]]}}}).toArray(function(err, docs) {
            log.info(docs);
            callback(null, docs);
        });
    });
}

poiModel.getPoisFromRadio = function(username,lat, lon, radio, callback)
{
    mongoose.connection.db.collection('POIS', function (err, collection) {
        collection.find({'username': username, 'location': {$near: { $geometry: { type: "Point" , coordinates: [ parseFloat(lon) , parseFloat(lat) ]}, $maxDistance: parseInt(radio)}}}).toArray(function(err, docs) {
            callback(null, docs);
        });
    });
}

//exportamos el objeto para tenerlo disponible en la zona de rutas
module.exports = poiModel;
