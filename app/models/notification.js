var Db = require('mongodb').Db;
var server = require('mongodb').Server;
var mongoose = require('mongoose');

var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('kyrosapi.properties');

var ObjectId = require('mongoose').Types.ObjectId;

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

mongoose.connect('mongodb://' + dbMongoHost + ':' + dbMongoPort + '/' + dbMongoName,  { server: { reconnectTries: 3, poolSize: 5 } }, function (error) {
    if (error) {
        log.info(error);
    }
});

// Crear un objeto para ir almacenando todo lo necesario
var notificationModel = {};

notificationModel.getConfigNotifications = function(username, deviceId, callback)
{
    mongoose.connection.db.collection('NOTIFICATION', function (err, collection) {
      collection.find({"username": username, "device_id": deviceId}).toArray(function(err, docs) {
          callback(null, docs);
        });
    });
}

notificationModel.getAllNotifications = function(username, callback)
{
    mongoose.connection.db.collection('APP_NOTIFICATION', function (err, collection) {
      collection.find({"username": username}).sort({'timestamp': -1}).toArray(function(err, docs) {
          callback(null, docs);
        });
    });
}

notificationModel.getNotification = function(_id, callback)
{
    mongoose.connection.db.collection('APP_NOTIFICATION', function (err, collection) {
      collection.find({"_id": new ObjectId(_id)}).toArray(function(err, docs) {
          callback(null, docs);
        });
    });
}

notificationModel.getLastNotifications = function(username, max, group, callback)
{
    mongoose.connection.db.collection('APP_NOTIFICATION', function (err, collection) {
      //collection.find({"username": username}).sort({'timestamp': -1}).toArray(function(err, docs) {
      if (group==1) {
        collection.find({"username": username}).sort({'vehicle_license': 1, 'timestamp': -1}).toArray(function(err, docs) {
            var result = {'status': 'ok', 'num_notifications': docs.length, 'result': docs.slice(0, max-1)};
            callback(null, result);
          });
      } else {
        collection.find({"username": username}).sort({'timestamp': -1}).toArray(function(err, docs) {
            var result = {'status': 'ok', 'num_notifications': docs.length, 'result': docs.slice(0, max-1)};
            callback(null, result);
          });
      }
    });
}

notificationModel.getLastNotificationsTimestamp = function(username, timestamp, callback)
{
    mongoose.connection.db.collection('APP_NOTIFICATION', function (err, collection) {
        collection.find({"username": username, "timestamp": {$gt: timestamp}}).sort({'vehicle_license': 1, 'timestamp': -1}).toArray(function(err, docs) {
            var result = {'status': 'ok', 'num_notifications': docs.length, 'result': docs};
            callback(null, result);
          });
    });
}

notificationModel.archiveNotification = function(username, notificationId, callback)
{
    mongoose.connection.db.collection('APP_NOTIFICATION', function (err, collection) {
        collection.remove({'_id': new ObjectId(notificationId)}, function(err, doc){
             if (err) {
               callback(err, null);
             } else {
               callback(null, []);
             }
        });
    });
}

notificationModel.archiveAllNotifications = function(username, callback)
{
    mongoose.connection.db.collection('APP_NOTIFICATION', function (err, collection) {
        collection.remove({'username': username}, function(err, doc){
             if (err) {
               callback(err, null);
             } else {
               callback(null, []);
             }
        });
    });
}


notificationModel.saveToken = function(username, token, callback)
{
    mongoose.connection.db.collection('USER', function (err, collection) {
        collection.find({'username': username}).toArray(function(err, docs) {
            if (docs[0]!=undefined) {
                docs[0].token = token;
                collection.save(docs[0]);
                callback(null, docs);
            } else {
                callback(null, []);
            }
        });
    });
}

notificationModel.configNotificationChange0 = function(username, deviceId, eventType, enabled, callback)
{
    mongoose.connection.db.collection('NOTIFICATION', function (err, collection) {

      var query = {
        "username": username,
        "device_id": deviceId,
        "event_type": parseInt(eventType)
      };
      var element = {
        "enabled": parseInt(enabled),
      };
      collection.findOneAndUpdate(query, element, { new:true}, function(err, doc){
        callback(null, doc);
      });
    });
}

notificationModel.configNotificationChange = function(username, deviceId, eventType, enabled, callback)
{
    var db = new Db(dbMongoName, new server(dbMongoHost, dbMongoPort));

       db.open(function (err, db) {
        if (err) {
            callback(err, null);
        }
        else {
            var collection = db.collection('NOTIFICATION');
            var query = {
                "username": username,
                "device_id": parseInt(deviceId),
                "event_type": parseInt(eventType)
            };
            var element = {
                "enabled": parseInt(enabled),
            };

            collection.findOneAndUpdate(query, {$set: element}, {upsert:true,new:true}, function(err, doc){
                callback(null, doc);
            });
        }
       });
}

notificationModel.configNotificationAdd = function(username, vehicleLicense, eventIdList, callback)
{
    mongoose.connection.db.collection('NOTIFICATION', function (err, collection) {
        var eventArray = eventIdList.split(',');
        var result = [];
        for (var i=0; i<eventArray.length; i++) {
          var element = {
            username: username,
            vehicle_license: vehicleLicense,
            event_type: parseInt(eventArray[i])
          };
          collection.findOneAndUpdate(element, element, {upsert:true}, function(err, doc){
          });
          result.push(element);
        }
        callback(null, result);
    });
}

notificationModel.configNotificationRemove = function(username, vehicleLicense, eventIdList, callback)
{
    mongoose.connection.db.collection('NOTIFICATION', function (err, collection) {
        var eventArray = eventIdList.split(',');
        var result = [];
        var eventsToRemove = [];
        for (var i=0; i<eventArray.length; i++) {
          var element = {
            username: username,
            vehicle_license: vehicleLicense,
            event_type: parseInt(eventArray[i])
          };
          eventsToRemove.push(parseInt(eventArray[i]));
          result.push(element);
        }
        collection.remove({'username':username, 'vehicle_license':vehicleLicense, 'event_type': { $in: eventsToRemove } } , function(err, doc){
        });
        callback(null, result);
    });
}

notificationModel.enableUserNotifications = function(username, callback)
{
    mongoose.connection.db.collection('USER', function (err, collection) {
        collection.find({'username': username}).toArray(function(err, docs) {
            if (docs[0]!=undefined) {
                docs[0].push_enabled = 1;
                collection.save(docs[0]);
                callback(null, docs);
            } else {
                callback(null, []);
            }
        });
    });
}

notificationModel.disableUserNotifications = function(username, callback)
{
    mongoose.connection.db.collection('USER', function (err, collection) {
        collection.find({'username': username}).toArray(function(err, docs) {
            if (docs[0]!=undefined) {
                docs[0].push_enabled = 0;
                collection.save(docs[0]);
                callback(null, docs);
            } else {
                callback(null, []);
            }
        });
    });
}

notificationModel.statusUserNotifications = function(username, callback)
{
    mongoose.connection.db.collection('USER', function (err, collection) {
        collection.find({'username': username}).toArray(function(err, docs) {
            if (docs[0]!=undefined) {
                callback(null, docs[0].push_enabled);
            } else {
                callback(null, -1);
            }
        });
    });
}

notificationModel.statusUserVehicleNotifications = function(username, vehicleLicense, callback)
{
    mongoose.connection.db.collection('NOTIFICATION', function (err, collection) {
        collection.find({'username': username, 'vehicle_license': vehicleLicense}).toArray(function(err, docs) {
          result = {'panic': false, 'start_stop': false, 'zone': false, 'route': false, 'poi': false, 'other': false}
          for (var i=0; i<docs.length; i++) {
            if (docs[i].event_type==902) {
              result.panic = true;
            }
            else if (docs[i].event_type==912) {
              result.start_stop = true;
            }
            else if (docs[i].event_type==962) {
              result.route = true;
            }
            else if (docs[i].event_type==948) {
              result.zone = true;
            }
            else if (docs[i].event_type==990) {
              result.poi = true;
            }
            else if (docs[i].event_type==910) {
              result.other = true;
            }
          }
          callback(null, result);
        });
    });
}

//exportamos el objeto para tenerlo disponible en la zona de rutas
module.exports = notificationModel;
