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

// Crear la conexion a la base de datos

var dbMongoName = properties.get('bbdd.mongo.name');
var dbMongoHost = properties.get('bbdd.mongo.ip');
var dbMongoPort = properties.get('bbdd.mongo.port');

mongoose.connect('mongodb://' + dbMongoHost + ':' + dbMongoPort + '/' + dbMongoName, { server: { reconnectTries: 3, poolSize: 5 } }, function (error) {
    if (error) {
        log.info(error);
    }
});

var apiModel = {};


//leer contadores
apiModel.getCounters = function (callback) {
    /*mongoose.connection.db.collection('API_COUNTER', function (err, collection) {
        collection.find().toArray(function (err, docs) {
            callback(null, docs);
        });
    });*/
     callback(null, []);
}

//incrementar contador para la operacion
apiModel.registerOperation = function (operation, callback) {
    if (operation == 'GET') {
        fs.readFile(properties.get('main.counter.get.file'), 'utf8', function (err, data) {
            var newdata = 0;
            try {
                newdata = parseInt(data) + 1;
            } catch (err) {
                newdata = 1;
            }

            fs.writeFile(properties.get('main.counter.get.file'), newdata, function (err) {
            });
        });
    } else if (operation == 'POST') {
        fs.readFile(properties.get('main.counter.post.file'), 'utf8', function (err, data) {
            //isNaN(parseFloat(data))
            
                var newdata = parseInt(data) + 1;
                /*if (!isNaN(newdata)) {
                    newdata = 1;
                }*/
            fs.writeFile(properties.get('main.counter.post.file'), newdata, function (err) {
            });
        });
    }

    callback(null, null);

}
module.exports = apiModel;
