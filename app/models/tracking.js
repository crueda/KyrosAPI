var Db = require('mongodb').Db;
var server = require('mongodb').Server;
var moment = require('moment');
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
//var dbMongoHost = "192.168.28.251";
var dbMongoPort = properties.get('bbdd.mongo.port');

var db = new Db(dbMongoName, new server(dbMongoHost, dbMongoPort));

mongoose.createConnection('mongodb://' + dbMongoHost + ':' + dbMongoPort + '/' + dbMongoName, function (error) {
    if (error) {
        log.info(error);
    }
});


// Crear un objeto para ir almacenando todo lo necesario
var trackingModel = {};

//TODO. MODIFICAR!
trackingModel.getTracking1FromUser = function(username,callback)
{
  db.open(function(err, db) {
    if(err) {
        callback(err, null);
    }
    else {
        var collection = db.collection('tracking1');
        collection.find({'monitor': username}).toArray(function(err, docs) {
            callback(null, docs);
        });
    }
  });
}

trackingModel.getTracking1 = function(callback)
{
    mongoose.connection.db.collection('TRACKING1', function (err, collection) {
        collection.find().sort({'pos_date': -1}).toArray(function(err, docs) {
            callback(null, docs);
        });
    });
}

trackingModel.getTracking1Radio = function(lat, lon, radio, callback)
{
    //log.info("radio:" + radio);
    mongoose.connection.db.collection('TRACKING1', function (err, collection) {
        collection.find({'location': {$near: { $geometry: { type: "Point" , coordinates: [ parseFloat(lon) , parseFloat(lat) ]}, $maxDistance: parseInt(radio)}}}).toArray(function(err, docs) {
        //collection.find({location:{ $near :{$geometry: { type: "Point",  coordinates: [ -3, 40.78 ] },$maxDistance: 50000}}}).toArray(function(err, docs) {
            //log.info("docs:" + docs);
            callback(null, docs);
        });
    });
}

trackingModel.getTracking1FromVehicle = function(vehicleLicense,callback)
{
    mongoose.connection.db.collection('TRACKING_'+vehicleLicense, function (err, collection) {
        collection.find().sort({'pos_date': -1}).limit(1).toArray(function(err, docs) {
            callback(null, docs);
        });
    });

  /*db.open(function(err, db) {
    if(err) {
        callback(err, null);
    }
    else {
        var collection = db.collection('TRACKING_'+vehicleLicense);
        collection.find().sort({"pos_date": -1}).limit(1).toArray(function(err, docs) {
            callback(null, docs);
        });
    }
  });*/
}

trackingModel.getTracking1AndIconFromVehicle = function(vehicleLicense,callback)
{
    mongoose.connection.db.collection('TRACKING_'+vehicleLicense, function (err, collection) {
        collection.find().sort({'pos_date': -1}).limit(1).toArray(function(err, docs) {
          mongoose.connection.db.collection('VEHICLE', function (err, collection) {
              collection.find({"vehicle_license": vehicleLicense}).toArray(function(err, docs2) {
                if (docs[0]!=undefined) {
                  if (docs2[0]!=undefined) {
                    docs[0].icon = docs2[0].icon_real_time.substring(0, docs2[0].icon_real_time.indexOf('.')) + '.svg';;
                    docs[0].alias = docs2[0].alias;
                  } else {
                    docs[0].icon = "car.svg";
                    docs[0].alias = vehicleLicense;
                  }
                }
                callback(null, docs);
              });
            });
          });
    });
}

//TODO. MODIFICAR!
trackingModel.getTracking1FromVehicles = function(vehicleLicenseList,callback)
{
  db.open(function(err, db) {
    if(err) {
        callback(err, null);
    }
    else {

        log.info(vehicleLicenseList);
        vehicleLicenseList_array = vehicleLicenseList.split(",");
        /*
        for (i=0; i<vehicleLicenseList_array.length; i++) {
            var collection = db.collection('TRACKING_'+vehicleLicenseList_array[i]);
            collection.find().toArray(function(err, docs) {
                callback(null, docs);
            });
        }*/
    }
  });
}


trackingModel.getLastTrackingsFromVehicle = function(requestData,callback)
{
  db.open(function(err, db) {
    if(err) {
        callback(err, null);
    }
    else {
        var collection = db.collection('TRACKING_'+requestData.vehicleLicense);
        collection.find().sort({"pos_date": -1}).limit(parseInt(requestData.ntrackings)).toArray(function(err, docs) {
            callback(null, docs);
        });
    }
  });
}


trackingModel.getTrackingFromVehicleAndDate = function(requestData,callback)
{
    mongoose.connection.db.collection('TRACKING_'+requestData.vehicleLicense, function (err, collection) {
        collection.find({'pos_date': {$gt: parseInt(requestData.initDate), $lt: parseInt(requestData.endDate)}}).sort({'pos_date': 1}).limit(7000).toArray(function(err, docs) {
            callback(null, docs);
        });
    });
}



trackingModel.getTrackingFromVehicle = function(requestData,callback)
{
  db.open(function(err, db) {
    if(err) {
        callback(err, null);
    }
    else {
        var collection = db.collection('TRACKING_'+requestData.vehicleLicense);
        collection.find({'tracking_id': parseInt(requestData.trackingId)}).toArray(function(err, docs) {
            callback(null, docs);
        });
    }
  });
}

//exportamos el objeto para tenerlo disponible en la zona de rutas
module.exports = trackingModel;
