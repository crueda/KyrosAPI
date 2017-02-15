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
var activityModel = {};

activityModel.getActivity = function(requestData,callback)
{

        mongoose.connection.db.collection('TRACKING_'+requestData.vehicleLicense, function (err, collection) {
        collection.find({'pos_date': {$gt: parseInt(requestData.initDate), $lt: parseInt(requestData.endDate)}}).sort({'pos_date': 1}).toArray(function(err, docs) {
        //collection.find({'pos_date': {$gt: parseInt(requestData.initDate), $lt: parseInt(requestData.endDate)}}).limit(1000).sort({'pos_date': 1}).toArray(function(err, docs) {
            log.info(docs);
            var jsondocs = jsonfy(JSON.stringify(docs)); 

            var json_graphs = {"datasets": 
                [
                    {
                        "type": "line", "valueDecimals": 1, 
                        "name": "Velocidad", "unit": "km/h",
                        "data": []
                    }, 
                    {
                        "type": "area", "valueDecimals": 0, 
                        "name": "Altitud", "unit": "m",
                        "data": []
                    },
                    {
                        "type": "area", "valueDecimals": 0,                 
                        "name": "Distancia", "unit": "m",
                        "data": []
                    }
                ],
                "xData": []
            }

            var total_distance = 0;
            for (item in jsondocs) {
                if (jsondocs[item].speed!=null)
                    json_graphs.datasets[0].data.push(jsondocs[item].speed);
                else 
                    json_graphs.datasets[0].data.push(0);
                if (jsondocs[item].altitude!=null)
                    json_graphs.datasets[1].data.push(jsondocs[item].altitude);
                else
                    json_graphs.datasets[1].data.push(0);
                json_graphs.datasets[2].data.push(total_distance);
                json_graphs.xData.push(jsondocs[item].pos_date);

                if (jsondocs[item].distance!=null)
                    total_distance = total_distance + jsondocs[item].distance;
            }
            //console.log(json_graphs);
            callback(null, JSON.stringify(json_graphs));
        });
        });

}

activityModel.getActivityWithHR = function(requestData,callback)
{

        mongoose.connection.db.collection('TRACKING_'+requestData.vehicleLicense, function (err, collection) {
        collection.find({'pos_date': {$gt: parseInt(requestData.initDate), $lt: parseInt(requestData.endDate)}}).limit(1000).sort({'pos_date': 1}).toArray(function(err, docs) {
            var jsondocs = jsonfy(JSON.stringify(docs)); 

            var json_graphs = {"datasets": 
                [
                    {
                        "type": "line", "valueDecimals": 1, 
                        "name": "Velocidad", "unit": "km/h",
                        "data": []
                    }, 
                    {
                        "type": "area", "valueDecimals": 0, 
                        "name": "Altitud", "unit": "m",
                        "data": []
                    },
                    {
                        "type": "area", "valueDecimals": 0,                 
                        "name": "Distancia", "unit": "m",
                        "data": []
                    },
                    {
                        "type": "area", "valueDecimals": 0,                 
                        "name": "Ritmo cardiaco", "unit": "bpm",
                        "data": []
                    }
                ],
                "xData": []
            }

            var total_distance = 0;
            for (item in jsondocs) {
                json_graphs.datasets[0].data.push(jsondocs[item].speed);
                json_graphs.datasets[1].data.push(jsondocs[item].altitude);
                json_graphs.datasets[2].data.push(total_distance);
                json_graphs.datasets[3].data.push(jsondocs[item].heading);
                json_graphs.xData.push(jsondocs[item].pos_date);

                total_distance = total_distance + jsondocs[item].distance;
            }

            callback(null, JSON.stringify(json_graphs));
        });
        });

}

//exportamos el objeto para tenerlo disponible en la zona de rutas
module.exports = activityModel;

