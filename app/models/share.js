var Db = require('mongodb').Db;
var server = require('mongodb').Server;
var uuid = require('node-uuid');
var moment = require('moment');
var EM = require('../modules/email-dispatcher');

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

var db = new Db(dbMongoName, new server(dbMongoHost, dbMongoPort));

// Crear un objeto para ir almacenando todo lo necesario
var shareModel = {};

shareModel.addSharing = function(requestData, callback)
{
    db.open(function(err, db) {
        if(err) {
            callback(err, null);
        }
        else {
            var collectionVehicle = db.collection('VEHICLE');
            collectionVehicle.find({'vehicle_license': requestData.vehicleLicense}).toArray(function(err, docsVehicle) {
            
                var collection = db.collection('SHARE');

                var timestamp = (new Date).getTime();
                var expiration = timestamp + 86400000;
                var uuid1 = uuid.v1();

                var shareCollection = {
                    vehicle_license: requestData.vehicleLicense,
                    email: requestData.email,
                    username: requestData.username,
                    timestamp: timestamp,
                    expiration: expiration,
                    icon_real_time: docsVehicle[0].icon_real_time,
                    icon_cover: docsVehicle[0].icon_cover,
                    icon_alarm: docsVehicle[0].icon_alarm,
                    alias: docsVehicle[0].alias,
                    uuid: uuid1

                }
                collection.save(shareCollection);
                
                // enviar mail
                EM.dispatchShareVehicleLink(shareCollection, function(e, m){
                    if (m!=null){
                        callback(null, "ok");
                    }   else{
                        callback(null, "nok");
                    }
                });
            });

            
        }
    });

}


//exportamos el objeto para tenerlo disponible en la zona de rutas
module.exports = shareModel;

