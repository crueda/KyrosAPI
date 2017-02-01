var server = require('mongodb').Server;
var Db = require('mongodb').Db;
var GridStore = require('mongodb').GridStore;
var Busboy = require('busboy'); 
var Grid = require('gridfs-stream'); 

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
var imageModel = {};

imageModel.getImageVehicle = function(vehicleLicense,callback)
{
    db.open(function(err, db) {
        if (err)
             callback(null, '');
        else {
            var gridStore = new GridStore(db, vehicleLicense, "r").open(function(err, gridStore) {
                if (err)
                    callback(null, '');
                else {
                    gridStore.read(function(err, data) {
                        if (err)
                            callback(null, '');
                        else
                            callback(null, data.toString('base64'));
                    });            
                }
            });            
        }
    });
}

imageModel.getIconVehicle = function(vehicleLicense,callback)
{
    db.open(function(err, db) {
        if (err)
             callback(null, '');
        else {
            var gridStore = new GridStore(db, 'icon_'+vehicleLicense, "r").open(function(err, gridStore) {
                if (err)
                    callback(null, '');
                else {
                    gridStore.read(function(err, data) {
                        if (err)
                            callback(null, '');
                        else
                            callback(null, data.toString('base64'));
                    });            
                }
            });            
        }
    });
}

imageModel.getIconVehicles = function(vehicleLicenseList,callback)
{
    var result = [];
    db.open(function(err, db) {
        if (err)
             callback(null, '');
        else {
            var array = vehicleLicenseList.split(',');
            for (var i=0; i<array.length; i++) {
                var vehicleLicense = array[i];        
                log.info("leer icono de:"+vehicleLicense);
                var gridStore = new GridStore(db, 'icon_'+vehicleLicense, "r").open(function(err, gridStore) {
                    if (err)
                        callback(null, '');
                    else {
                        gridStore.read(function(err, data) {
                            if (err)
                                log.error("error al leer el gridStore");
                                //callback(null, '');
                            else
                                //callback(null, data.toString('base64'));
                                log.info("leido icono de:"+vehicleLicense);
                                result.push({"vehicle_license: ": vehicleLicense, "icon": data.toString('base64')})
                        });            
                    }
                });  
            }
            callback(null, result);          
        }
    });
}

imageModel.uploadImageVehicle = function(vehicleLicense,req,callback)
{
    var gfs;
    db.open(function(err, db) {
        if (err) 
             callback(null, null);
        gfs = Grid(db, mongo);
    });

    var busboy = new Busboy({ headers : req.headers });
    var fileId = new mongo.ObjectId();

    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
    log.debug('got file', filename, mimetype, encoding);
    var writeStream = gfs.createWriteStream({
      _id: fileId,
      filename: filename,
      mode: 'w',
      content_type: mimetype,
    });
    file.pipe(writeStream);
    }).on('finish', function() {
        callback(null, "");
    });

  req.pipe(busboy);
}

imageModel.uploadIconVehicle = function(vehicleLicense,req,callback)
{
    var gfs;
    db.open(function(err, db) {
        if (err) 
             callback(null, null);
        gfs = Grid(db, mongo);
    });

    var busboy = new Busboy({ headers : req.headers });
    var fileId = new mongo.ObjectId();

    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
    log.debug('got file', 'icon_'+filename, mimetype, encoding);
    var writeStream = gfs.createWriteStream({
      _id: fileId,
      filename: 'icon_'+filename,
      mode: 'w',
      content_type: mimetype,
    });
    file.pipe(writeStream);
    }).on('finish', function() {
        callback(null, "");
    });

  req.pipe(busboy);
}

//exportamos el objeto para tenerlo disponible en la zona de rutas
module.exports = imageModel;

