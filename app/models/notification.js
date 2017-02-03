var server = require('mongodb').Server;
var mongoose = require('mongoose');
var Db = require('mongodb').Db;

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

mongoose.connect('mongodb://' + dbMongoHost + ':' + dbMongoPort + '/' + dbMongoName, function (error) {
    if (error) {
        log.info(error);
    }
});

// Crear un objeto para ir almacenando todo lo necesario
var notificationModel = {};

notificationModel.getConfigNotifications = function(username, vehicleLicense, callback)
{
    mongoose.connection.db.collection('NOTIFICATION', function (err, collection) {
      collection.find({"username": username, "vehicle_license": vehicleLicense}).toArray(function(err, docs) {
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
            //log.info(result);
            callback(null, result);
          });
      } else {
        collection.find({"username": username}).sort({'timestamp': -1}).toArray(function(err, docs) {
            var result = {'status': 'ok', 'num_notifications': docs.length, 'result': docs.slice(0, max-1)};
            //log.info(result);
            callback(null, result);
          });
      }
    });
}

notificationModel.archiveNotification = function(username, notificationId, callback)
{
    mongoose.connection.db.collection('APP_NOTIFICATION', function (err, collection) {
        /*collection.find({'_id': new ObjectId(notificationId)}).toArray(function(err, docs) {
            if (docs[0]!=undefined) {
                docs[0].archive = 1;
                collection.save(docs[0]);
                callback(null, docs);
            } else {
                callback(null, []);
            }
        });*/
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
  db.open(function(err, db) {
    if(err) {
        callback(err, null);
    }
    else {
        var collection = db.collection('APP_NOTIFICATION');
        //collection.update({}, {$set: {archive: 1}},{multi: true},function(err, result) {
        collection.remove({'username':username } , function(err, doc){
             if (err) {
               callback(err, null);
             } else {
               callback(null, []);
             }
        });
    }
  });
  /*
    mongoose.connection.db.collection('NOTIFICATION_' + username, function (err, collection) {
      //collection.update({}, {$set: {archive: 0}}, {multi: true}).toArray(function(err, docs) {
        collection.updateMany({}, {$set: {archive: 0}}).toArray(function(err, docs) {
            callback(null, docs);
        });
    });
    */
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

notificationModel.configNotificationChange = function(username, vehicleLicense, eventType, enabled, callback)
{
    mongoose.connection.db.collection('NOTIFICATION', function (err, collection) {
      var element = {
        username: username,
        vehicle_license: vehicleLicense,
        event_type: eventType,
        enabled: enabled
      };
      collection.findOneAndUpdate(element, element, {upsert:true}, function(err, doc){
        callback(null, element);
      });
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
