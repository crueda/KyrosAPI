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

mongoose.createConnection('mongodb://' + dbMongoHost + ':' + dbMongoPort + '/' + dbMongoName, function (error) {
    if (error) {
        log.info(error);
    }
});

// Crear un objeto para ir almacenando todo lo necesario
var loginModel = {};

loginModel.login = function(username, password, callback)
{
    mongoose.connection.db.collection('USER', function (err, collection) {
        collection.find( { 'username': username}).toArray(function(err, docs) {
            if (docs!=undefined && docs.length>=0) {
                if (docs[0]== undefined) {
                    callback(null, {"status": "nok"});
                } else {
                    if( crypt(password, docs[0]['password']) !== docs[0]['password']) {
                        callback(null, {"status": "nok"});
                    } else {
                        callback(null, {"status": "ok", "result": docs});
                    }
                }
            } else {
                callback(null, {"status": "nok"});
            }
        });
    });
}

//exportamos el objeto para tenerlo disponible en la zona de rutas
module.exports = loginModel;
