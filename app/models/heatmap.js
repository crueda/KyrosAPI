var mongoose = require('mongoose');
var server = require('mongodb').Server;
var moment = require('moment');
var jsonfy = require('jsonfy');

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
var heatmapModel = {};

heatmapModel.getHeatmapData = function(requestData,callback)
{
    mongoose.connection.db.collection('TRACKING', function (err, collection) {
        collection.find({'device_id': parseInt(requestData.deviceId), 'pos_date': {$gt: parseInt(requestData.initDate), $lt: parseInt(requestData.endDate)}}).sort({'pos_date': 1}).toArray(function(err, docs) {
            var jsondocs = jsonfy(JSON.stringify(docs)); 

            var json_data = {"type": "FeatureCollection",
                "features": []
            }

            for (item in jsondocs) {
                var json_feature = {
                    "geometry": {  
                        "type": "Point",
                        "coordinates": [jsondocs[item].location.coordinates[0], jsondocs[item].location.coordinates[1]]
                    },
                    "type": "Feature",
                    "properties": {
                    "deviceId": jsondocs[item].deviceId
                    }
                }
                json_data.features.push(json_feature);
            }
            callback(null, JSON.stringify(json_data));
        });
    });
}

//exportamos el objeto para tenerlo disponible en la zona de rutas
module.exports = heatmapModel;

