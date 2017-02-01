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
var userModel = {};

userModel.setUserPreferences = function(username, push_mode, group_mode, max_show_notifications, callback)
{
  mongoose.connection.db.collection('USER', function (err, collection) {
      collection.find({'username': username}).toArray(function(err, docs) {
          if (docs[0]!=undefined) {
            docs[0].push_enabled = parseInt(push_mode);
            docs[0].group_notifications = parseInt(group_mode);
            if (max_show_notifications!=undefined) {
              docs[0].max_show_notifications = parseInt(max_show_notifications);
            }
            collection.save(docs[0]);
            callback(null, docs);
          } else {
            callback(null, []);
          }
      });
  });
}

userModel.getUserFromUsername = function(username, callback)
{
  mongoose.connection.db.collection('USER', function (err, collection) {
      collection.find({'username': username}).toArray(function(err, docs) {
          callback(null, docs);
      });
  });
}

userModel.saveDeviceInfo = function(username, token, device_model,
  device_platform, device_version, device_manufacturer,device_serial, device_uuid,
  device_height, device_width, device_language,  callback)
{
    mongoose.connection.db.collection('USER', function (err, collection) {
        collection.find({'username': username}).toArray(function(err, docs) {
            if (docs[0]!=undefined) {
                docs[0].token = token;
                device_info = {
                  'device_model': device_model,
                  'device_platform': device_platform,
                  'device_version': device_version,
                  'device_manufacturer': device_manufacturer,
                  'device_serial': device_serial,
                  'device_uuid': device_uuid,
                  'device_height': device_height,
                  'device_width': device_width,
                  'device_language': device_language,
                  'last_login': new Date().toISOString()
                }
                docs[0].device_info = device_info;

                collection.save(docs[0]);
                callback(null, docs);
            } else {
                callback(null, []);
            }
        });
    });
}

//exportamos el objeto para tenerlo disponible en la zona de rutas
module.exports = userModel;
