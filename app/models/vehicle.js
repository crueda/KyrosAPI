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
              if (row[0] != undefined) {
                if (row[0].name == null || row[0].name == '') {
                  row[0].name = row[0].alias;
                }

                //callback(null, row);
                var sqlDriver = "select DRIVER.DRIVER_ID as id, DRIVER.FIRST_NAME as firstName, DRIVER.LAST_NAME as lastName from DRIVER, DRIVES, VEHICLE where DRIVES.DEVICE_ID=VEHICLE.DEVICE_ID and DRIVER.DRIVER_LICENSE=DRIVES.DRIVER_LICENSE and DRIVER.ROLE_ID=4 and VEHICLE.DEVICE_ID=" + id + "  group by id"
                log.debug("Query: " + sqlDriver);
                connection.query(sqlDriver, function (error, rowDriver) {
                  connection.release();
                  if (error) {
                    callback(error, null);
                  }
                  else {
                    /*if (rowCapitan[0] != undefined) {
                      var json_capitan = '{"id":' + rowCapitan[0].id
                        + ',"firstName":"' + rowCapitan[0].firstName + '"'
                        + ',"latName":"' + rowCapitan[0].lastName + '"'
                        + '}';
                      row[0].vesselMaster = JSON.parse(json_capitan);
                    }
                    else {*/
                    //row[0].driver = JSON.parse('{}');
                    row[0].driver = rowDriver;

                    //}
                    callback(null, row);
                  }
                });
              } else {
                callback(null, null);
              }
            }
          });
        }
        else {
          callback(null, null);
        }
      });
    }

//añadir 1 nuevo
vehicleModel.insertVehicle = function (vehicleData, callback) {
      pool.getConnection(function (err, connection) {
        if (connection) {
          var now = moment(new Date());

          var sql = "INSERT INTO VEHICLE SET VEHICLE_LICENSE = " + connection.escape(vehicleData.name) + "," +
            "BASTIDOR = " + connection.escape(vehicleData.name) + "," +
            "ALIAS = " + connection.escape(vehicleData.alias) + "," +
            "INITIALISED_DATE = " + now + "," +
            "INITIAL_DATE_PURCHASE = NOW(), " +
            "ALARM_ACTIVATED = 0," +
            "WORKING_SCHEDULE = 0," +
            "PROTOCOL_ID = 0," +
            "ALARM_STATE = -1," +
            "CELL_ID = 0," +
            "CLAXON = -1," +
            "CONSUMPTION = 0," +
            "ICON_DEVICE = " + properties.get('kyros.icon.vessel') + "," +
            "KIND_DEVICE = 1," +
            "MAX_SPEED = 100," +
            "MODEL_TRANSPORT = " + "'boat'" + "," +
            "POWER_SWITCH = -1," +
            "PRIVATE_MODE = 0," +
            "SPEAKER = -1," +
            "START_STATE = 'START'," +
            "WARNER = -1";

          log.debug("Query: " + sql);
          connection.query(sql, function (error, result) {
            if (error) {
              callback(error, null);
            }
            else {
              var deviceId = result.insertId;

              //insertar en tabla OBT
              var sqlObt = "INSERT INTO OBT SET IMEI = " + connection.escape(vehicleData.mmsi) + "," +
                "VERSION_ID = " + "11" + "," +
                "DEVICE_ID = " + deviceId + "," +
                "VEHICLE_LICENSE = " + connection.escape(vehicleData.name) + "," +
                "GSM_OPERATOR_ID = " + "0" + "," +
                "ID_CARTOGRAPHY_LAYER = " + "0" + "," +
                "ID_TIME_ZONE = " + "1" + "," +
                "TYPE_SPECIAL_OBT = " + properties.get('kyros.device.vessel') + "," +
                "LOGGER = " + "0";

              log.debug("Query: " + sqlObt);
              connection.query(sqlObt, function (error, result) {
                if (error) {
                  callback(error, null);
                }
                else {
                  //insertar en tabla HAS
                  var sqlHas = 'INSERT INTO HAS SET FLEET_ID = ' + connection.escape(vehicleData.vesselType) + ',' +
                    'DEVICE_ID = ' + deviceId + ',' +
                    'VEHICLE_LICENSE = ' + connection.escape(vehicleData.name);

                  log.debug("Query: " + sqlHas);
                  connection.query(sqlHas, function (error, result) {
                    connection.release();
                    if (error) {
                      callback(error, null);
                    }
                    else {
                      //devolvemos la última id insertada
                      callback(null, { "insertId": deviceId });
                    }
                  });
                }
              });
            }
          });
        }
        else {
          callback(null, null);
        }
      });
    }

//actualizar
vehicleModel.updateVehicle = function (vehicleData, callback) {
      pool.getConnection(function (err, connection) {
        if (connection) {
          var sql = "UPDATE VEHICLE SET ALIAS = " + connection.escape(vehicleData.alias) + "," +
            //"BASTIDOR = " + connection.escape(vehicleData.name) + "," +
            "FLAG = " + connection.escape(vehicleData.flag) + "," +
            "EMAIL = " + connection.escape(vehicleData.email) + "," +
            "WHERE DEVICE_ID = " + vehicleData.id;

          //console.log(sql);
          log.debug("Query: " + sql);
          connection.query(sql, function (error, result) {
            connection.release();
            if (error) {
              callback(error, null);
            }
            else {
              // Actualizar la tabla HAS  ??

              // TODO. Hacer roolback si hay error en este segundo update?

              //log.debug ("Success !");

              callback(null, { "message": "success" });
            }
          });
        }
        else {
          callback(null, null);
        }
      });
    }

//eliminar 1
vehicleModel.deleteVessel = function (id, callback) {
      pool.getConnection(function (err, connection) {
        if (connection) {
          //var sqlExists = 'SELECT VEHICLE_LICENSE FROM VEHICLE WHERE DEVICE_ID = ' + connection.escape(id);
          var sqlExists = "SELECT 'VEHICLE' as type, V.DEVICE_ID as id, DOCK_NUMBER as dockNumber, AUDIT_STATE as auditState,  DATE_FORMAT(FROM_UNIXTIME(FLOOR(V.INITIALISED_DATE/1000)), '%Y-%m-%dT%H:%m:%s.%SZ') as creationTime, V.ALIAS as alias, V.BASTIDOR as name, V.VEHICLE_LICENSE as mmsi, V.FLAG as flag, DATE_FORMAT(FROM_UNIXTIME(FLOOR(V.AUDIT_DATE/1000)), '%Y-%m-%dT%H:%m:%s.%SZ') as expirationAuditDate, F.DESCRIPTION_FLEET as vesselType, V.BUILT as built,  FROM VEHICLE V, HAS H, FLEET F where V.DEVICE_ID=H.DEVICE_ID and H.FLEET_ID=F.FLEET_ID and V.DEVICE_ID = " + connection.escape(id);
          log.debug("Query: " + sqlExists);
          connection.query(sqlExists, function (err, row) {
            if (row) {
              var sql = 'DELETE FROM VEHICLE WHERE DEVICE_ID = ' + connection.escape(id);
              log.debug("Query: " + sql);
              connection.query(sql, function (error, result) {
                if (error) {
                  callback(error, null);
                }
                else {
                  // Borrar de la tabla HAS
                  var sqlHas = 'DELETE FROM HAS WHERE DEVICE_ID = ' + connection.escape(id);
                  log.debug("Query: " + sqlHas);

                  connection.query(sqlHas, function (error, result) {
                    connection.release();
                    if (error) {
                      callback(error, null);
                    }
                    else {
                      // se devuelven los datos del elemento eliminado
                      callback(null, row);
                    }
                  });
                }
              });
            }
            else {
              connection.release();
              callback(null, { "message": "notExist" });
            }
          });
        }
        else {
          callback(null, null);
        }
      });
    }

//provisionar
vehicleModel.AISVessel = function (mmsi, typeVessel, callsign, shipname, aistype, callback) {
      pool.getConnection(function (err, connection) {

        console.log("COMPROBAR: " + mmsi);

        if (connection) {
          var sqlExists = "SELECT  count(*) as nvessels FROM VEHICLE where VEHICLE_LICENSE = " + connection.escape(mmsi);
          log.debug("Query: " + sqlExists);
          connection.query(sqlExists, function (err, row) {
            if (row[0].nvessels > 0) {
              if (typeVessel != 0) {
                var sqlUpdate = "UPDATE VEHICLE SET ICON_DEVICE = " + connection.escape(typeVessel) + " " +
                  "WHERE VEHICLE_LICENSE = " + connection.escape(mmsi);
                //console.log(sql);
                log.debug("Query: " + sqlUpdate);
                connection.query(sqlUpdate, function (error, result) {
                  if (error) {
                    callback(error, null);
                  }
                  else {
                    callback(null, { "message": "success" });
                  }
                });
              }
              else {
                callback(null, { "message": "success" });
              }
            }
            else {
              console.log("PROVISIONAR: " + mmsi);

              // Provisionar el barco
              var now = moment(new Date());

              // Insertar en la tabla VEHICLE
              var sql = "INSERT INTO VEHICLE SET VEHICLE_LICENSE = " + connection.escape(mmsi) + "," +
                "ALIAS = " + connection.escape(shipname) + "," +
                "INITIALISED_DATE = " + now + "," +
                "INITIAL_DATE_PURCHASE = NOW(), " +
                "CALLSIGN = " + connection.escape(callsign) + "," +
                "BASTIDOR = " + "''" + "," +
                "FLAG = " + "''" + "," +
                "AUDIT_DATE = " + "''" + "," +
                "BUILT = " + "''" + "," +
                "AIS_TYPE = " + connection.escape(aistype) + "," +
                "MMSI = " + connection.escape(mmsi) + "," +
                "ALARM_ACTIVATED = 0," +
                "ALARM_STATE = -1," +
                "WORKING_SCHEDULE = 0," +
                "PROTOCOL_ID = 0," +
                "CELL_ID = 0," +
                "CLAXON = -1," +
                "CONSUMPTION = 0," +
                "ICON_DEVICE = " + connection.escape(typeVessel) + "," +
                "KIND_DEVICE = 1," +
                "MAX_SPEED = 100," +
                "MODEL_TRANSPORT = " + "'boat'" + "," +
                "POWER_SWITCH = -1," +
                "PRIVATE_MODE = 0," +
                "SPEAKER = -1," +
                "START_STATE = 'START'," +
                "WARNER = -1";

              log.debug("Query: " + sql);
              connection.query(sql, function (error, result) {
                if (error) {
                  callback(error, null);
                }
                else {
                  console.log("VEHICLE OK" + mmsi);

                  var deviceId = result.insertId;

                  //insertar en tabla OBT
                  var sqlObt = 'INSERT INTO OBT SET IMEI = ' + connection.escape(mmsi) + ',' +
                    'VERSION_ID = ' + '11' + ',' +
                    'DEVICE_ID = ' + deviceId + ',' +
                    'VEHICLE_LICENSE = ' + connection.escape(mmsi) + ',' +
                    'GSM_OPERATOR_ID = ' + '0' + ',' +
                    'ID_CARTOGRAPHY_LAYER = ' + '0' + ',' +
                    'ID_TIME_ZONE = ' + '1' + ',' +
                    'TYPE_SPECIAL_OBT = ' + '0' + ',' +
                    'LOGGER = ' + '0';

                  log.debug("Query: " + sqlObt);
                  connection.query(sqlObt, function (error, result) {
                    if (error) {
                      callback(error, null);
                    }
                    else {
                      console.log("OBT OK" + mmsi);

                      //insertar en tabla HAS
                      var sqlHas = 'INSERT INTO HAS SET FLEET_ID = ' + properties.get('kyros.fleet.others.id') + ',' +
                        'DEVICE_ID = ' + deviceId + ',' +
                        'VEHICLE_LICENSE = ' + connection.escape(mmsi);

                      log.debug("Query: " + sqlHas);
                      connection.query(sqlHas, function (error, result) {
                        connection.release();
                        if (error) {
                          callback(error, null);
                        }
                        else {
                          console.log("HAS OK" + mmsi);

                          console.log("PROVISIONAR - OK!");

                          //devolvemos la última id insertada
                          callback(null, { "insertId": deviceId });
                        }
                      });
                    }
                  });
                }
              });
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
