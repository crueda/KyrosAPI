var Db = require('mongodb').Db;
var server = require('mongodb').Server;

var jsonfy = require('jsonfy');
var flatten = require('flat');
var unflatten = require('flat').unflatten;

var mongoose = require('mongoose');

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

var db = new Db(dbMongoName, new server(dbMongoHost, dbMongoPort));

mongoose.connect('mongodb://' + dbMongoHost + ':' + dbMongoPort + '/' + dbMongoName, { server: { reconnectTries: 3, poolSize: 5 } }, function (error) {
    if (error) {
        log.info(error);
    }
});


var monitorJson = [];
//var monitorJson = {"type":0, "nodes": [], "nodes_names": []};
var monitorJsonFlat = { '0.text': 'root' };
var propiedad = "";
var node_name = "";

// Crear un objeto para ir almacenando todo lo necesario
var monitorModel = {};



monitorModel.putElement = function (element, depth) {
    var children = element.nodes;
    var children_names = element.nodes_names;
    for (var i = 0, len = children_names.length; i < len; i++) {
        if (children[i].type == 0) {
            if (element.type == 0) {
                if (element.nodes == children[i].name) {
                    children[i].nodes.push(element);
                } else {
                    iterate(children[i], depth + 1);
                }
            }
        }
    }
}



monitorModel.getMonitorFromUser = function (username, callback) {
    mongoose.connection.db.collection('TREE', function (err, collection) {
        collection.find({ 'username': username }).toArray(function (err, docs) {
            //log.info(JSON.stringify(docs));
            callback(null, docs);
        });
    });
}

monitorModel.getMonitorListFromUser = function (username, callback) {
    mongoose.connection.db.collection('MONITOR', function (err, collection) {
        collection.find({ 'username': username }).toArray(function (err, docs) {
            list = [];
            //log.info (flatten(docs))
            fdocs = flatten(docs);
            for (var k in fdocs) {
                if (k.indexOf("name") != -1) {
                    //list.push({"vehicle_license":fdocs[k]});
                    list.push(fdocs[k]);
                }
            }
            mongoose.connection.db.collection('VEHICLE', function (err, collection) {
                collection.find({ "vehicle_license": { $in: list } }).toArray(function (err, docs) {

                    for (var i = 0; i < docs.length; i++) {
                        try {
                            docs[i].icon_real_time = docs[i].icon_real_time.substring(0, docs[i].icon_real_time.indexOf('.')) + '.svg';
                            docs[i].icon_cover = docs[i].icon_cover.substring(0, docs[i].icon_cover.indexOf('.')) + '.svg';
                            docs[i].icon_alarm = docs[i].icon_alarm.substring(0, docs[i].icon_alarm.indexOf('.')) + '.svg';
                            docs[i].name_order = docs[i].vehicle_license.toLowerCase();
                        } catch (err) { }
                    }

                    callback(null, docs);
                });
            });

            //callback(null, list);
        });
    });

}

monitorModel.setMonitorCheckedFromUser = function (requestData, callback) {
    db.open(function (err, db) {
        if (err) {
            callback(err, null);
        }
        else {
            var collection = db.collection('MONITOR');
            collection.find({ 'username': requestData.username }).toArray(function (err, docs) {
                var jsondocs = jsonfy(JSON.stringify(docs));
                delete jsondocs[0]['_id'];
                flat_monitor = flatten(jsondocs);

                var vehicleLicenseChecked = requestData.vehicleLicenseList.split(',');

                var keys = Object.keys(flat_monitor);
                var indice = 0;
                var encontrado = false;
                for (var i = 0, length = keys.length; i < length; i++) {
                    //log.info (keys[i] + " - " + flat_monitor[ keys[ i ] ]);
                    if (keys[i].indexOf("checked") != -1) {
                        flat_monitor[keys[i]] = "false";
                        indice = i;
                        if (encontrado) {
                            flat_monitor[keys[indice]] = "true";
                            indice = 0;
                            encontrado = false;
                        }

                    }

                    if (keys[i].indexOf("vehicle_license") != -1) {
                        var license = flat_monitor[keys[i]];
                        if (vehicleLicenseChecked.indexOf(license) != -1) {
                            encontrado = true;
                            if (indice != 0) {
                                flat_monitor[keys[indice]] = "true";
                                indice = 0;
                                encontrado = false;
                            }
                        }
                    }
                }

                var u = unflatten(flat_monitor);
                collection.remove({ "username": requestData.username }, function (err, result) {
                    if (err) {
                        callback(null, null);
                    } else {
                        collection.save(u['0']);
                        db.close();
                        callback(null, docs);
                    }

                });

            });
        }
    });
}


//exportamos el objeto para tenerlo disponible en la zona de rutas
module.exports = monitorModel;
