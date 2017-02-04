var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('kyrosapi.properties');
var Db = require('mongodb').Db;
var server = require('mongodb').Server;
var mongoose = require('mongoose');
var jsonfy = require('jsonfy');
var flatten = require('flat');
var unflatten = require('flat').unflatten;

var dbMongoName = properties.get('bbdd.mongo.name');
var dbMongoHost = properties.get('bbdd.mongo.ip');
var dbMongoPort = properties.get('bbdd.mongo.port');

var db = new Db(dbMongoName, new server(dbMongoHost, dbMongoPort));
/*
mongoose.connect('mongodb://' + dbMongoHost + ':' + dbMongoPort + '/' + dbMongoName, function (error) {
    if (error) {
        console.log("Error al conectar");
    } else {
        console.log("Conexión ok");        
    } 
});
*/
console.log("start");
var username = "crueda";

 db.open(function(err, db) {
    if(err) {
        console.log("Error al conectar");
    }
    else {
        var collection = db.collection('MONITOR');
        collection.find({'username': username}).toArray(function(err, docs) {

        var jsondocs = jsonfy(JSON.stringify(docs));
        //delete jsondocs[0]['_id'];
        flat_monitor = flatten(jsondocs);

            var monitor_fleet = [];
            var monitor_vehicle = [];
            var keys = Object.keys( flat_monitor );
            var indice = 0;
            var enflota = false;
            for( var i = 0,length = keys.length; i < length; i++ ) {
               // console.log (keys[i] + " - " + flat_monitor[ keys[ i ] ]);

                if (keys[i].indexOf("type")!=-1) {
                    var valor = flat_monitor[ keys[ i ] ];
                    if (valor == 0) {
                        enflota = true;
                    } else {
                        enflota = false;
                    }
                }

                if (keys[i].indexOf(".id")!=-1) {
                    var valor = flat_monitor[ keys[ i ] ];
                    if (!enflota) {
                        //console.log("-->" + valor);
                        monitor_vehicle.push(valor);
                    } 
                    else  {
                        monitor_fleet.push(valor);
                    } 
                }
                

            }

            console.log("-->" + monitor_fleet);
            console.log("-->" + monitor_vehicle);

            
            var u = unflatten(flat_monitor);
            collection.remove({"username": username}, function(err, result) {
            if (err) {
                console.log("Error al guardar");
                callback(null, null);
            } else {
                console.log("**>" + u['0']);
                collection.save(u['0']);                
                db.close();
                console.log("guardar ok");
            }

            });
            

        });
     }
  });
