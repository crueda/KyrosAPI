var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('kyrosapi.properties');
var mongoose = require('mongoose');
var moment = require("moment");

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
var pool = mysql.createPool(dbConfig);

var dbMongoName = properties.get('bbdd.mongo.name');
var dbMongoHost = properties.get('bbdd.mongo.ip');
var dbMongoPort = properties.get('bbdd.mongo.port');

mongoose.connect('mongodb://' + dbMongoHost + ':' + dbMongoPort + '/' + dbMongoName, function (error) {
  if (error) {
    log.info(error);
  }
});

//crear un objeto para ir almacenando todo lo que necesitemos
var vehicleModel = {};

//Obtener los vehiculos del usuario
vehicleModel.getVehicles = function (startRow, endRow, sortBy, username, callback) {
  vehicleModel.getVehiclesFromUsername(username, function (error, monitor_vehicle) {
    pool.getConnection(function (err, connection) {
      if (connection) {
        var sqlCount = 'SELECT count (*) as nrows FROM VEHICLE where DEVICE_ID IN (' + monitor_vehicle + ')';
        log.debug("Query: " + sqlCount);
        connection.query(sqlCount, function (err, row) {
          if (row) {
            var consulta = "SELECT DEVICE_ID as id, MAX_SPEED as max_speed, DATE_FORMAT(FROM_UNIXTIME(FLOOR(INITIALISED_DATE/1000)), '%Y-%m-%dT%H:%m:%sZ') as creationTime, ALIAS as alias, BASTIDOR as name, VEHICLE_LICENSE as license, MODEL_TRANSPORT as model FROM VEHICLE where DEVICE_ID IN (" + monitor_vehicle + ")";

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
                  if (element == 'id' || element == 'creationTime' || element == 'max_speed' || element == 'alias' || element == 'model') {
                    if (orderBy == '')
                      orderBy = element + ' desc';
                    else
                      orderBy = orderBy + ',' + element + ' desc';
                  }
                } else {
                  var element = vsortBy[i];
                  if (element == 'id' || element == 'creationTime' || element == 'max_speed' || element == 'alias' || element == 'model') {
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
              try {
                //console.log(">>"+rows.length);
                for (i = 0; i < rows.length; i++) {
                  if (rows[i].name == null || rows[i].name == '') {
                    rows[i].name = rows[0].alias;
                  }
                }
              } catch (err) { }

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

//obtenemos 1
vehicleModel.getVehicle = function (id, callback) {
  pool.getConnection(function (err, connection) {
    if (connection) {
      var sql = "SELECT DEVICE_ID as id, MAX_SPEED as max_speed, DATE_FORMAT(FROM_UNIXTIME(FLOOR(INITIALISED_DATE/1000)), '%Y-%m-%dT%H:%m:%sZ') as creationTime, ALIAS as alias, BASTIDOR as name, VEHICLE_LICENSE as license, MODEL_TRANSPORT as model FROM VEHICLE where DEVICE_ID = " + connection.escape(id);

      log.debug("Query: " + sql);
      connection.query(sql, function (error, row) {
        if (error) {
          callback(error, null);
        }
        else {
          if (row.length > 0 && row[0] != undefined) {
            if (row[0].name == null || row[0].name == '') {
              row[0].name = row[0].alias;
            }

            //callback(null, row);
            var sqlDriver = "select DRIVER.DRIVER_LICENSE as license, DRIVER.FIRST_NAME as firstName, DRIVER.LAST_NAME as lastName from DRIVER, DRIVES, VEHICLE where DRIVES.DEVICE_ID=VEHICLE.DEVICE_ID and DRIVER.DRIVER_LICENSE=DRIVES.DRIVER_LICENSE and VEHICLE.DEVICE_ID=" + id;
            log.debug("Query: " + sqlDriver);
            connection.query(sqlDriver, function (error, rowDriver) {
              connection.release();
              if (error) {
                callback(error, null);
                //callback(null, row);
              }
              else {
                row[0].driver = rowDriver;
                callback(null, row);
              }
            });
          } else {
            callback(null, []);
          }
        }
      });
    }
    else {
      callback(null, null);
    }
  });
}





vehicleModel.getVehiclesFromUsername = function (username, callback) {
  mongoose.connection.db.collection('USER', function (err, collection) {
    collection.find({ 'username': username }).toArray(function (err, docs) {
      if (docs[0] == undefined || docs[0].monitor_vehicle == undefined) {
        callback(null, []);
      } else {
        callback(null, docs[0].monitor_vehicle);
      }
    });
  });
}

//exportamos el objeto para tenerlo disponible en la zona de rutas
module.exports = vehicleModel;
