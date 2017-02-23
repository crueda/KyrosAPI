var server = require('mongodb').Server;
var mongoose = require('mongoose');
var crypt = require('crypt3');
var moment = require('moment');

var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('kyrosapi.properties');

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

mongoose.connect('mongodb://' + dbMongoHost + ':' + dbMongoPort + '/' + dbMongoName, { server: { reconnectTries: 3, poolSize: 5 } }, function (error) {
    if (error) {
        log.info(error);
    }
});

// Crear un objeto para ir almacenando todo lo necesario
var reportModel = {};

reportModel.getReportDailyData = function (vehicleLicense, callback) {
    function padToTwo(number) {
        if (number <= 9) { number = ("0" + number).slice(-4); }
        return number;
    }

    var start = moment().add(-1, 'day').startOf('day');
    var end = moment().startOf('day');
    //var start = 1487318303000;

    mongoose.connection.db.collection('ODOMETER', function (err, collection) {
        collection.find({ 'vehicle_license': vehicleLicense }).toArray(function (err, docsOdometer) {
    
    mongoose.connection.db.collection('TRACKING_' + vehicleLicense, function (err, collection) {
        collection.find({ 'pos_date': { $lt: Number(end), $gt: Number(start-1000) } }).sort({ "pos_date": 1 }).toArray(function (err, docs) {
        //collection.find({ 'pos_date': { $lt: Number(end), $gt: Number(start-1000) } ,  'events': {"$not": {"$size": 0}} }).sort({ "pos_date": 1 }).toArray(function (err, docs) {
            var out = {
                "dayDistance": 0,
                "weekDistance": 0,
                "monthDistance": 0,
                "daySpeed": 0,
                "weekSpeed": 0,
                "monthSpeed": 0,
                "dayConsume": 0,
                "weekConsume": 0,
                "monthConsume": 0,
                "reportDailyStartDate": "",
                "reportDailyStartGeocoding": "",
                "reportDailyEndDate": "",
                "reportDailyEndGeocoding": "",
                "reportDailyDuration": "00:00:00",
                "reportDailyAverageSpeed": 0,
                "reportDailyMaxSpeed": 0,
                "reportDailyDistance": 0,
                "reportDailyConsumption": 0,
                "reportDailyCO2": 0,
                "reportDailyEventsStart": 0,
                "reportDailyEventsStop": 0,
                "reportDailyEventsUnplug": 0,
                "reportDailyEventsMaxSpeed": 0,
                "events": {},
                "tracking": []
            };

            if (docsOdometer[0]!=undefined) {
                out.dayDistance = docsOdometer[0].dayDistance,
                out.weekDistance = docsOdometer[0].weekDistance,
                out.monthDistance = docsOdometer[0].monthDistance,
                out.daySpeed = docsOdometer[0].daySpeed,
                out.weekSpeed = docsOdometer[0].weekSpeed,
                out.monthSpeed = docsOdometer[0].monthSpeed,
                out.dayConsume = docsOdometer[0].dayConsume,
                out.weekConsume = docsOdometer[0].weekConsume,
                out.monthConsume = docsOdometer[0].monthConsume,
            }

            var posDateInit = 0;
            var posDateEnd = 0;
            var sumSpeed = 0;
            var count = 0;

            for (var i = 0; i < docs.length; i++) {

                if (i == 0) {
                    var epochStart = moment(new Date(docs[i].pos_date));
                    out.reportDailyStartDate = epochStart.format("HH:mm:ss");
                    out.reportDailyStartGeocoding = docs[i].geocoding;
                    posDateInit = docs[i].pos_date;
                } else if (i == docs.length - 1) {
                    var epochEnd = moment(new Date(docs[i].pos_date));
                    out.reportDailyEndDate = epochEnd.format("HH:mm:ss");
                    out.reportDailyEndGeocoding = docs[i].geocoding;
                    posDateEnd = docs[i].pos_date;
                }
                out.reportDailyDistance = out.reportDailyDistance + docs[i].distance;
                if (docs[i].speed > out.reportDailyMaxSpeed) {
                    out.reportDailyMaxSpeed = docs[i].speed.toFixed(1);
                }
                sumSpeed = sumSpeed + docs[i].speed;
                count = count + 1;

                // tracking
                tracking_point = {
                    "longitude": docs[i].location.coordinates[0],
                    "latitude": docs[i].location.coordinates[1]                
                }
                out.tracking.push (tracking_point);

                // eventos
                for (var j = 0; j < docs[i].events.length; j++) {
                    var eventType = "" + docs[i].events[j].event_type;
                    if(out.events.hasOwnProperty(eventType)){
                        out.events[eventType] = out.events[eventType] + 1;
                    } else {
                        out.events[eventType] = 0;
                    }
                }
            }
            if (count>1) {
                var duration = posDateEnd - posDateInit;
                var dateDuration = new Date(posDateEnd - posDateInit);
                var dateDurationUTC = new Date(dateDuration.getUTCFullYear(), dateDuration.getUTCMonth(), dateDuration.getUTCDate(), dateDuration.getUTCHours(), dateDuration.getUTCMinutes(), dateDuration.getUTCSeconds()); 

                var h = dateDurationUTC.getHours();
                var m = dateDurationUTC.getMinutes();
                var s = dateDurationUTC.getSeconds();
                out.reportDailyDuration = padToTwo(h) + ":" + padToTwo(m) + ":" + padToTwo(s);
            } 

            if (count != 0) {
                out.reportDailyAverageSpeed = (sumSpeed / count).toFixed(1);
            }
            out.reportDailyDistance = out.reportDailyDistance.toFixed(3);

            mongoose.connection.db.collection('VEHICLE', function (err, collection) {
                collection.find({ 'vehicle_license': vehicleLicense}).toArray(function (err, docsVehicle) {
                    out.reportDailyConsumption = (docsVehicle[0].consumption * (out.reportDailyDistance/100)).toFixed(2);
                    out.reportDailyCO2 = (out.reportDailyConsumption*2.68).toFixed(2);
                    callback(null, out);
                });
            });
        });

    });
    });
    
    });
}

//exportamos el objeto para tenerlo disponible en la zona de rutas
module.exports = reportModel;
