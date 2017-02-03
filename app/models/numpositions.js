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

mongoose.connect('mongodb://' + dbMongoHost + ':' + dbMongoPort + '/' + dbMongoName, function (error) {
    if (error) {
        log.info(error);
    }
});

// Crear un objeto para ir almacenando todo lo necesario
var numpositionsModel = {};

numpositionsModel.getNumpositions = function(requestData,callback)
{
        mongoose.connection.db.collection('TRACKING_'+requestData.vehicleLicense, function (err, collection) {
        collection.find({'pos_date': {$gt: parseInt(requestData.initDate), $lt: parseInt(requestData.endDate)}}).sort({'pos_date': 1}).toArray(function(err, docs) {
            var jsondocs = jsonfy(JSON.stringify(docs)); 

            var json_graphs = {"dataset": 
                {
                    "data": [],
                    "xData": []
                }
                
            }
            var nTrackings = 0;
            for (item in jsondocs) { 
                nTrackings +=1 ;
            }
            //console.log(jsondocs.lenght);
            var nPositions = 0;            
            var indexElement = 0;
            if (jsondocs[0] != null) {
                realInitDate = parseInt(jsondocs[0].pos_date);
                realEndDate = parseInt(jsondocs[nTrackings-1].pos_date);
                step = (realEndDate - realInitDate) / requestData.slots
                log.info("realinit:"+realInitDate);
                log.info("realend:"+realEndDate);
                log.info("step:"+step);
                initDateSlot = parseInt(jsondocs[0].pos_date);
                for (item in jsondocs) {                    
                    newDate = parseInt(jsondocs[item].pos_date);
                    if (newDate > initDateSlot + step) {
                        //log.info("---STEP---"+newDate);
                        json_graphs.dataset.xData.push(initDateSlot);
                        json_graphs.dataset.data.push(nPositions);
                        nPositions = 0;                    
                        initDateSlot = newDate;
                    }
                    else {
                        nPositions += 1;
                    }
                }
            }
            //console.log(json_graphs);
            callback(null, JSON.stringify(json_graphs));
        });
        });
}

numpositionsModel.getNumpositionsGroupByHeading = function(requestData,callback)
{
        mongoose.connection.db.collection('TRACKING_'+requestData.vehicleLicense, function (err, collection) {
        collection.find({'pos_date': {$gt: parseInt(requestData.initDate), $lt: parseInt(requestData.endDate)}}).sort({'pos_date': 1}).toArray(function(err, docs) {
            var jsondocs = jsonfy(JSON.stringify(docs)); 

            var json_graphs = {"dataset": 
                {
                    "data": []
                }
                
            }
            var nHeading0 = 0;
            var nHeading45 = 0;
            var nHeading90 = 0;
            var nHeading135 = 0;
            var nHeading180 = 0;
            var nHeading225 = 0;
            var nHeading270 = 0;
            var nHeading315 = 0;
            for (item in jsondocs) {                                        
                heading = parseInt(jsondocs[item].heading);
                if (heading>0 && heading <45)
                    nHeading0 += 1;
                else if (heading>45 && heading <90)
                    nHeading45 += 1;
                else if (heading>90 && heading <135)
                    nHeading135 += 1;
                else if (heading>135 && heading <180)
                    nHeading135 += 1;
                else if (heading>180 && heading <225)
                    nHeading180 += 1;
                else if (heading>225 && heading <270)
                    nHeading225 += 1;
                else if (heading>225 && heading <270)
                    nHeading225 += 1;
                else if (heading>270 && heading <315)
                    nHeading270 += 1;
                else if (heading>315)
                    nHeading315 += 1;
                else if (heading==0)
                    nHeading0 += 1;
                else if (heading==45)
                    nHeading45 += 1;
                else if (heading==90)
                    nHeading90 += 1;
                else if (heading==135)
                    nHeading135 += 1;
                else if (heading==180)
                    nHeading180 += 1;
                else if (heading==225)
                    nHeading225 += 1;
                else if (heading==270)
                    nHeading270 += 1;
                else if (heading==315)
                    nHeading315 += 1;                      
            }

            json_graphs.dataset.data.push(nHeading0);
            json_graphs.dataset.data.push(nHeading45);
            json_graphs.dataset.data.push(nHeading90);
            json_graphs.dataset.data.push(nHeading135);
            json_graphs.dataset.data.push(nHeading180);
            json_graphs.dataset.data.push(nHeading225);
            json_graphs.dataset.data.push(nHeading270);
            json_graphs.dataset.data.push(nHeading315);

            callback(null, JSON.stringify(json_graphs));
        });
        });
}


//exportamos el objeto para tenerlo disponible en la zona de rutas
module.exports = numpositionsModel;

