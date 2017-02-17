var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('kyrosapi.properties');
var mongoose = require('mongoose');

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

/*var dbConfig = {
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
var pool = mysql.createPool(dbConfig);
*/

var dbMongoName = properties.get('bbdd.mongo.name');
var dbMongoHost = properties.get('bbdd.mongo.ip');
var dbMongoPort = properties.get('bbdd.mongo.port');

mongoose.connect('mongodb://' + dbMongoHost + ':' + dbMongoPort + '/' + dbMongoName, function (error) {
  if (error) {
    log.info(error);
  }
});

// Crear un objeto para ir almacenando todo lo necesario
var fleetModel = {};

// Obtener las flotas del usuario
fleetModel.getFleets = function (username, callback) {
  fleetModel.getFleetsFromUsername(username, function (error, monitor_fleet) {
    mongoose.connection.db.collection('FLEET', function (err, collection) {
        collection.find({"id": {$in: monitor_fleet}}, { _id: 0}).toArray(function (err, docs) {
            callback(null, docs);
        });
      });
  });
}

// Obtener un fleet por su id
fleetModel.getFleet = function (id, callback) {
  mongoose.connection.db.collection('FLEET', function (err, collection) {
    collection.find({ 'id': parseInt(id) }, { _id: 0}).toArray(function (err, docs) {
        callback(null, docs);
    });
  });
}


fleetModel.getFleetsFromUsername = function (username, callback) {
  mongoose.connection.db.collection('USER', function (err, collection) {
    collection.find({ 'username': username }).toArray(function (err, docs) {
      if (docs[0] == undefined || docs[0].monitor_fleet == undefined) {
        callback(null, []);
      } else {
        callback(null, docs[0].monitor_fleet);
      }
    });
  });
}


// MYSQL

fleetModel.getFleets_mysql = function (username, callback) {
  fleetModel.getFleetsFromUsername(username, function (error, monitor_fleet) {
    pool.getConnection(function (err, connection) {
      if (connection) {
        var sqlCount = 'SELECT count(*) as nrows FROM FLEET where FLEET_ID IN (' + monitor_fleet + ')';
        log.debug("Query: " + sqlCount);
        connection.query(sqlCount, function (err, row) {
          if (row) {
            var consulta = 'SELECT FLEET_ID as id, DESCRIPTION_FLEET as description, CONSIGNOR_ID as companyId FROM FLEET where FLEET_ID IN(' + monitor_fleet + ')';

            var totalRows = row[0].nrows;

            var sql = '';
            var orderBy = '';

            if (sortBy == null) {
              orderBy = 'id';
            }
            else {
              vsortBy = sortBy.split(',');
              for (var i = 0; i < vsortBy.length; i++) {
                if (vsortBy[i].charAt(0) == '-') {
                  var element = vsortBy[i].substring(1, vsortBy[i].length);
                  if (element == 'id' || element == 'description' || element == 'weight' || element == 'longitude' || element == 'latitude' || element == 'height') {
                    if (orderBy == '')
                      orderBy = element + ' desc';
                    else
                      orderBy = orderBy + ',' + element + ' desc';
                  }
                } else {
                  var element = vsortBy[i];
                  if (element == 'id' || element == 'description' || element == 'weight' || element == 'longitude' || element == 'latitude' || element == 'height') {
                    if (orderBy == '')
                      orderBy = element;
                    else
                      orderBy = orderBy + ',' + element;
                  }
                }
              }
            }

            if (orderBy == '') {
              orderBy = 'id';
            }

            if (startRow == null || endRow == null) {
              sql = consulta + " ORDER BY " + orderBy;
            }
            else {
              sql = consulta + " ORDER BY " + orderBy + " LIMIT " + (endRow - startRow + 1) + " OFFSET " + startRow;
            }

            log.debug("Query: " + sql);
            connection.query(sql, function (error, rows) {
              connection.release();
              if (error) {
                callback(error, null);
              }
              else {
                callback(null, rows, totalRows);
              }
            });
          }
          else {
            connection.release();
            callback(null, []);
          }
        });
      }
      else {
        callback(null, null);
      }
    }); // pool mysql conection
  });
}

fleetModel.getFleet_mysql = function (id, callback) {
  pool.getConnection(function (err, connection) {
    if (connection) {
      var sql = 'SELECT FLEET_ID as id, DESCRIPTION_FLEET as description, CONSIGNOR_ID as companyId FROM FLEET WHERE FLEET_ID = ' + connection.escape(id);
      log.debug("Query: " + sql);
      connection.query(sql, function (error, row) {
        connection.release();
        if (error) {
          callback(error, null);
        }
        else {
          callback(null, row);
        }
      });
    }
    else {
      callback(null, null);
    }
  });
}

//exportamos el objeto para tenerlo disponible en la zona de rutas
module.exports = fleetModel;
