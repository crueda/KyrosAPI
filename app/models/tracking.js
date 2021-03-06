var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('kyrosapi.properties');

var mongoose = require('mongoose');
var moment = require("moment");

// Definición del log
var fs = require('fs');
var log = require('tracer').console({
  transtracking: function (data) {
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
var connection = mysql.createPool(dbConfig);


var dbMongoName = properties.get('bbdd.mongo.name');
var dbMongoHost = properties.get('bbdd.mongo.ip');
var dbMongoPort = properties.get('bbdd.mongo.port');

//mongoose.createConnection('mongodb://' + dbMongoHost + ':' + dbMongoPort + '/' + dbMongoName,  { server: { reconnectTries: 3, poolSize: 5 } }, function (error) {
mongoose.connect('mongodb://' + dbMongoHost + ':' + dbMongoPort + '/' + dbMongoName, { server: { reconnectTries: 3, poolSize: 5 } }, function (error) {
  if (error) {
    log.info(error);
  }
});

var trackingModel = {};

trackingModel.getTracking1FromFleet = function (fleetId, callback) {
  mongoose.connection.db.collection('FLEET', function (err, collection) {
    collection.find({ "id": parseInt(fleetId) }).toArray(function (err, docsFleet) {
      if (docsFleet!=undefined &&  docsFleet[0]!= undefined) {
        mongoose.connection.db.collection('TRACKING1', function (err, collection) {
          collection.find({ "device_id": { $in: docsFleet[0].vehicle } }, { _id: 0, "vehicle_license": 0, "events": 0, "alarm_activated": 0, "location.type": 0 }).toArray(function (err, docs) {
            docs.forEach(function (doc) {
              doc['trackingDate'] = moment(new Date(doc["pos_date"])).format("YYYY-MM-DDTHH:mm:ssZ").substring(0, 19) + 'Z';
              doc['longitude'] = doc['location']['coordinates'][0];
              doc['latitude'] = doc['location']['coordinates'][1];
              doc['location'] = undefined;
              doc['pos_date'] = undefined;
              doc['deviceId'] = doc['device_id'];
              doc['id'] = doc['tracking_id'];
              doc['device_id'] = undefined;
              doc['tracking_id'] = undefined;
            });
            callback(null, docs);
          });
        });
      } else {
        callback(null, []);
      }
    });
  });
}

trackingModel.getTracking1FromFleet_Mysql = function (fleetId, callback) {
  if (connection) {
    var sql = "select TRACKING_1.TRACKING_ID as id, TRACKING_1.DEVICE_ID as deviceId, IFNULL(ROUND(TRACKING_1.GPS_SPEED,1), 0) as speed, IFNULL(ROUND(TRACKING_1.ALTITUDE), 0) as altitude, IFNULL(TRACKING_1.HEADING, 0) as heading, (TRACKING_1.POS_LATITUDE_DEGREE + TRACKING_1.POS_LATITUDE_MIN/60) as latitude, (POS_LONGITUDE_DEGREE + TRACKING_1.POS_LONGITUDE_MIN/60) as longitude, DATE_FORMAT(FROM_UNIXTIME(FLOOR(TRACKING_1.POS_DATE/1000)), '%Y-%m-%dT%H:%m:%sZ') as trackingDate from TRACKING_1 LEFT JOIN HAS ON TRACKING_1.DEVICE_ID=HAS.DEVICE_ID LEFT JOIN FLEET ON HAS.FLEET_ID=FLEET.FLEET_ID WHERE FLEET.FLEET_ID=" + fleetId;
    log.debug("Query: " + sql);
    connection.query(sql, function (error, rows) {
      if (error) {
        callback(error, null);
      }
      else {
        callback(null, rows);
      }
    });
  } else {
    callback(null, null);
  }
}

trackingModel.getTracking1FromFleets = function (fleetIds, callback) {
  mongoose.connection.db.collection('FLEET', function (err, collection) {
    collection.find({ "id": { $in: fleetIds}}).toArray(function (err, docsFleet) {
      if (docsFleet!=undefined) {
        var vehicles = [];
        docsFleet.forEach(function (docFleet) {
          vehicles.push(docFleet['id']);
        });
        mongoose.connection.db.collection('TRACKING1', function (err, collection) {
          collection.find({ "device_id": { $in: vehicles } }, { _id: 0, "vehicle_license": 0, "events": 0, "alarm_activated": 0, "location.type": 0 }).toArray(function (err, docs) {
            docs.forEach(function (doc) {
              doc['trackingDate'] = moment(new Date(doc["pos_date"])).format("YYYY-MM-DDTHH:mm:ssZ").substring(0, 19) + 'Z';
              doc['longitude'] = doc['location']['coordinates'][0];
              doc['latitude'] = doc['location']['coordinates'][1];
              doc['location'] = undefined;
              doc['pos_date'] = undefined;
              doc['deviceId'] = doc['device_id'];
              doc['id'] = doc['tracking_id'];
              doc['device_id'] = undefined;
              doc['tracking_id'] = undefined;
            });
            callback(null, docs);
          });
        });
        
      } else {
        callback(null, []);
      }
    });
  });
}

trackingModel.getTracking1FromFleets_Mysql = function (fleetIds, callback) {
  if (connection) {
    var sql = "select TRACKING_1.TRACKING_ID as id, TRACKING_1.DEVICE_ID as deviceId, IFNULL(ROUND(TRACKING_1.GPS_SPEED,1), 0) as speed, IFNULL(ROUND(TRACKING_1.ALTITUDE), 0) as altitude, IFNULL(TRACKING_1.HEADING, 0) as heading, (TRACKING_1.POS_LATITUDE_DEGREE + TRACKING_1.POS_LATITUDE_MIN/60) as latitude, (POS_LONGITUDE_DEGREE + TRACKING_1.POS_LONGITUDE_MIN/60) as longitude, DATE_FORMAT(FROM_UNIXTIME(FLOOR(TRACKING_1.POS_DATE/1000)), '%Y-%m-%dT%H:%m:%sZ') as trackingDate from TRACKING_1 LEFT JOIN HAS ON TRACKING_1.DEVICE_ID=HAS.DEVICE_ID LEFT JOIN FLEET ON HAS.FLEET_ID=FLEET.FLEET_ID WHERE FLEET.FLEET_ID IN(" + fleetIds + ")";
    log.debug("Query: " + sql);
    connection.query(sql, function (error, rows) {
      if (error) {
        callback(error, null);
      }
      else {
        callback(null, rows);
      }
    });
  } else {
    callback(null, null);
  }
}

trackingModel.getTracking1FromVehicle_Mysql = function (deviceId, callback) {
  if (connection) {
    var sql = "select TRACKING_1.TRACKING_ID as id, TRACKING_1.DEVICE_ID as deviceId, IFNULL(ROUND(TRACKING_1.GPS_SPEED,1), 0) as speed, IFNULL(ROUND(TRACKING_1.ALTITUDE), 0) as altitude, IFNULL(TRACKING_1.HEADING, 0) as heading, (TRACKING_1.POS_LATITUDE_DEGREE + TRACKING_1.POS_LATITUDE_MIN/60) as latitude, (POS_LONGITUDE_DEGREE + TRACKING_1.POS_LONGITUDE_MIN/60) as longitude, DATE_FORMAT(FROM_UNIXTIME(FLOOR(TRACKING_1.POS_DATE/1000)), '%Y-%m-%dT%H:%m:%sZ') as trackingDate from TRACKING_1 WHERE DEVICE_ID='" + deviceId.toString() + "'";
    log.debug("Query: " + sql);
    connection.query(sql, function (error, rows) {
      if (error) {
        callback(error, null);
      }
      else {
        callback(null, rows);
      }
    });
  } else {
    callback(null, null);
  }
}

trackingModel.getTracking1FromVehicles_Mysql = function (vehicleIds, callback) {
  if (connection) {
    var sql = "select TRACKING_1.TRACKING_ID as id, TRACKING_1.DEVICE_ID as deviceId, IFNULL(ROUND(TRACKING_1.GPS_SPEED,1), 0) as speed, IFNULL(ROUND(TRACKING_1.ALTITUDE), 0) as altitude, IFNULL(TRACKING_1.HEADING, 0) as heading, (TRACKING_1.POS_LATITUDE_DEGREE + TRACKING_1.POS_LATITUDE_MIN/60) as latitude, (POS_LONGITUDE_DEGREE + TRACKING_1.POS_LONGITUDE_MIN/60) as longitude, DATE_FORMAT(FROM_UNIXTIME(FLOOR(TRACKING_1.POS_DATE/1000)), '%Y-%m-%dT%H:%m:%sZ') as trackingDate from TRACKING_1 LEFT JOIN HAS ON TRACKING_1.DEVICE_ID=HAS.DEVICE_ID LEFT JOIN FLEET ON HAS.FLEET_ID=FLEET.FLEET_ID WHERE TRACKING_1.DEVICE_ID IN(" + vehicleIds + ")";
    log.debug("Query: " + sql);
    connection.query(sql, function (error, rows) {
      if (error) {
        callback(error, null);
      }
      else {
        callback(null, rows);
      }
    });
  } else {
    callback(null, null);
  }
}

trackingModel.getTracking1FromVehicle = function (deviceId, callback) {
  mongoose.connection.db.collection('TRACKING1', function (err, collection) {
    collection.find({ "device_id": parseInt(deviceId) }, { _id: 0, "vehicle_license": 0, "events": 0, "alarm_activated": 0, "location.type": 0 }).toArray(function (err, docs) {
      docs.forEach(function (doc) {
        doc['trackingDate'] = moment(new Date(doc["pos_date"])).format("YYYY-MM-DDTHH:mm:ssZ").substring(0, 19) + 'Z';
        doc['longitude'] = doc['location']['coordinates'][0];
        doc['latitude'] = doc['location']['coordinates'][1];
        doc['location'] = undefined;
        doc['pos_date'] = undefined;
        doc['deviceId'] = doc['device_id'];
        doc['id'] = doc['tracking_id'];
        doc['device_id'] = undefined;
        doc['tracking_id'] = undefined;
      });
      callback(null, docs);
    });
  });
}

trackingModel.getTracking1FromVehicles = function (vehicleIds, callback) {
  mongoose.connection.db.collection('TRACKING1', function (err, collection) {
    collection.find({ "device_id": { $in: vehicleIds } }, { _id: 0, "vehicle_license": 0, "events": 0, "alarm_activated": 0, "location.type": 0 }).toArray(function (err, docs) {
      docs.forEach(function (doc) {
        doc['trackingDate'] = moment(new Date(doc["pos_date"])).format("YYYY-MM-DDTHH:mm:ssZ").substring(0, 19) + 'Z';
        doc['longitude'] = doc['location']['coordinates'][0];
        doc['latitude'] = doc['location']['coordinates'][1];
        doc['location'] = undefined;
        doc['pos_date'] = undefined;
        doc['deviceId'] = doc['device_id'];
        doc['id'] = doc['tracking_id'];
        doc['device_id'] = undefined;
        doc['tracking_id'] = undefined;
      });
      callback(null, docs);
    });
  });
}

trackingModel.getTrackingFromVehicle = function (deviceId, initDate, endDate, callback) {
    var initEpoch = moment(initDate, 'YYYY-MM-DDTHH:mm:ssZ');
    var endEpoch = moment(endDate, 'YYYY-MM-DDTHH:mm:ssZ');

    mongoose.connection.db.collection('TRACKING', function (err, collection) {
      collection.find({ 'device_id': parseInt(deviceId), 'pos_date': { $gt: parseInt(initEpoch), $lt: parseInt(endEpoch) } }).sort({ 'pos_date': 1 }).limit(7000).toArray(function (err, docs) {
        docs.forEach(function (doc) {
          doc['trackingDate'] = moment(new Date(doc["pos_date"])).format("YYYY-MM-DDTHH:mm:ssZ").substring(0, 19) + 'Z';
          doc['longitude'] = doc['location']['coordinates'][0];
          doc['latitude'] = doc['location']['coordinates'][1];
          doc['location'] = undefined;
          doc['pos_date'] = undefined;
          doc['deviceId'] = doc['device_id'];
          doc['id'] = doc['tracking_id'];
          doc['device_id'] = undefined;
          doc['tracking_id'] = undefined;
        });
        callback(null, docs);
      });
    });
}

trackingModel.getTrackingFromVehicle_Mysql = function (deviceId, initDate, endDate, callback) {
  if (connection) {
    var initEpoch = moment(initDate, 'YYYY-MM-DDTHH:mm:ssZ');
    var endEpoch = moment(endDate, 'YYYY-MM-DDTHH:mm:ssZ');

    var sql = "select TRACKING_ID as id, DEVICE_ID as deviceId, IFNULL(ROUND(GPS_SPEED,1), 0) as speed, IFNULL(ROUND(ALTITUDE), 0) as altitude, IFNULL(HEADING, 0) as heading, (POS_LATITUDE_DEGREE + POS_LATITUDE_MIN/60) as latitude, (POS_LONGITUDE_DEGREE + POS_LONGITUDE_MIN/60) as longitude, DATE_FORMAT(FROM_UNIXTIME(FLOOR(POS_DATE/1000)), '%Y-%m-%dT%H:%m:%sZ') as trackingDate from TRACKING WHERE DEVICE_ID='" + deviceId + "'" +
      " and POS_DATE>" + initEpoch +
      " and POS_DATE<" + endEpoch +
      " order by POS_DATE desc limit 1000";
    log.info("Query: " + sql);
    connection.query(sql, function (error, rows) {
      if (error) {
        callback(error, null);
      }
      else {
        callback(null, rows);
      }
    });
  } else {
    callback(null, null);
  }
}


trackingModel.getTracking1 = function (callback) {
  mongoose.connection.db.collection('TRACKING1', function (err, collection) {
    collection.find().sort({ 'pos_date': -1 }).toArray(function (err, docs) {
      callback(null, docs);
    });
  });
}

trackingModel.getTracking1Radio = function (lat, lon, radio, callback) {
  mongoose.connection.db.collection('TRACKING1', function (err, collection) {
    collection.find({ 'location': { $near: { $geometry: { type: "Point", coordinates: [parseFloat(lon), parseFloat(lat)] }, $maxDistance: parseInt(radio) } } }).toArray(function (err, docs) {
      callback(null, docs);
    });
  });
}

trackingModel.getTracking1AndIconFromVehicle = function (vehicleLicense, callback) {
  mongoose.connection.db.collection('TRACKING1', function (err, collection) {
    collection.find({"vehicle_license": vehicleLicense}).toArray(function (err, docs) {
      mongoose.connection.db.collection('VEHICLE', function (err, collection) {
        collection.find({ "vehicle_license": vehicleLicense }).toArray(function (err, docs2) {
          if (docs[0] != undefined) {
            if (docs2[0] != undefined) {
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

trackingModel.getTracking1AndIconFromDevice = function (deviceId, callback) {
  mongoose.connection.db.collection('TRACKING1', function (err, collection) {
    collection.find({"device_id": parseInt(deviceId)}).toArray(function (err, docs) {
      mongoose.connection.db.collection('VEHICLE', function (err, collection) {
        collection.find({ "device_id": parseInt(deviceId) }).toArray(function (err, docs2) {
          if (docs[0] != undefined) {
            if (docs2[0] != undefined) {
              docs[0].time_zone = docs2[0].time_zone;
              docs[0].icon = docs2[0].icon_real_time.substring(0, docs2[0].icon_real_time.indexOf('.')) + '.svg';;
              docs[0].alias = docs2[0].alias;
            } else {
              docs[0].time_zone = 0;
              docs[0].icon = "car.svg";
              docs[0].alias = deviceId;
            }
          }
          callback(null, docs);
        });
      });
    });
  });
}

trackingModel.getTrackingFromVehicleAndDate = function (requestData, callback) {
  mongoose.connection.db.collection('TRACKING', function (err, collection) {
    collection.find({ 'vehicle_license': requestData.vehicleLicense, 'pos_date': { $gt: parseInt(requestData.initDate), $lt: parseInt(requestData.endDate) } }).sort({ 'pos_date': 1 }).limit(7000).toArray(function (err, docs) {
      callback(null, docs);
    });
  });
}

trackingModel.getTrackingFromDeviceAndDate = function (requestData, callback) {
  var salida = {'time_zone': '', 'tracking': []};
  mongoose.connection.db.collection('TRACKING', function (err, collection) {
    collection.find({ 'device_id': parseInt(requestData.deviceId), 'pos_date': { $gt: parseInt(requestData.initDate), $lt: parseInt(requestData.endDate) } }).sort({ 'pos_date': 1 }).limit(7000).toArray(function (err, docs) {
        mongoose.connection.db.collection('VEHICLE', function (err, collection) {
          collection.find({ "device_id": parseInt(requestData.deviceId) }).toArray(function (err, docsVehicle) {
            if (docs[0] != undefined) {
              salida.time_zone = docsVehicle[0].time_zone;
            }
            salida.tracking = docs;
            callback(null, salida);
          });
        });
    });
  });
}

//extrackingamos el objeto para tenerlo disponible en la zona de rutas
module.exports = trackingModel;
