var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('kyrosapi.properties');
var moment = require("moment");
var mongoose = require('mongoose');

// Definición del log
var fs = require('fs');
var log = require('tracer').console({
  transtracking : function(data) {
    //console.log(data.output);
    fs.open(properties.get('main.log.file'), 'a', 0666, function(e, id) {
      fs.write(id, data.output+"\n", null, 'utf8', function() {
        fs.close(id, function() {
        });
      });
    });
  }
});

var dbConfig = {
  host: properties.get('bbdd.mysql.ip') ,
  user: properties.get('bbdd.mysql.user') ,
  password: properties.get('bbdd.mysql.passwd') ,
  database: properties.get('bbdd.mysql.name'),
  connectionLimit: 50,
  queueLimit: 0,
  waitForConnection: true
};

// Crear la conexion a la base de datos
var mysql = require('mysql');
var connection = mysql.createPool(dbConfig);

var dbMongoName = properties.get('bbdd.mongo.name');
var dbMongoHost = properties.get('bbdd.mongo.ip');
var dbMongoPort = properties.get('bbdd.mongo.port');

mongoose.connect('mongodb://' + dbMongoHost + ':' + dbMongoPort + '/' + dbMongoName, function (error) {
    if (error) {
        log.info(error);
    } 
});

// Crear un objeto para ir almacenando todo lo necesario
var trackingModel = {};


// Obtener todos las trackings1 de una flota
trackingModel.getTracking1FromFleet = function(fleetId, callback)
{  
  if (connection) {
    var sql = "select TRACKING_1.TRACKING_ID as id, TRACKING_1.DEVICE_ID as deviceId, IFNULL(ROUND(TRACKING_1.GPS_SPEED,1), 0) as speed, IFNULL(ROUND(TRACKING_1.ALTITUDE), 0) as altitude, IFNULL(TRACKING_1.HEADING, 0) as heading, (TRACKING_1.POS_LATITUDE_DEGREE + TRACKING_1.POS_LATITUDE_MIN/60) as latitude, (POS_LONGITUDE_DEGREE + TRACKING_1.POS_LONGITUDE_MIN/60) as longitude, DATE_FORMAT(FROM_UNIXTIME(FLOOR(TRACKING_1.POS_DATE/1000)), '%Y-%m-%dT%H:%m:%sZ') as trackingDate from TRACKING_1 LEFT JOIN HAS ON TRACKING_1.DEVICE_ID=HAS.DEVICE_ID LEFT JOIN FLEET ON HAS.FLEET_ID=FLEET.FLEET_ID WHERE FLEET.FLEET_ID="+ fleetId;
    log.debug ("Query: "+sql);
    connection.query(sql, function(error, rows)
    {
      if(error)
      {
        callback(error, null);
      }
      else
      {
        callback(null, rows);
      }
    });
  } else {
    callback(null, null);
  }
}

// Obtener todos las trackings1 de una lista de flotas
trackingModel.getTracking1FromFleets = function(fleetIds, callback)
{  
  if (connection) {
    var sql = "select TRACKING_1.TRACKING_ID as id, TRACKING_1.DEVICE_ID as deviceId, IFNULL(ROUND(TRACKING_1.GPS_SPEED,1), 0) as speed, IFNULL(ROUND(TRACKING_1.ALTITUDE), 0) as altitude, IFNULL(TRACKING_1.HEADING, 0) as heading, (TRACKING_1.POS_LATITUDE_DEGREE + TRACKING_1.POS_LATITUDE_MIN/60) as latitude, (POS_LONGITUDE_DEGREE + TRACKING_1.POS_LONGITUDE_MIN/60) as longitude, DATE_FORMAT(FROM_UNIXTIME(FLOOR(TRACKING_1.POS_DATE/1000)), '%Y-%m-%dT%H:%m:%sZ') as trackingDate from TRACKING_1 LEFT JOIN HAS ON TRACKING_1.DEVICE_ID=HAS.DEVICE_ID LEFT JOIN FLEET ON HAS.FLEET_ID=FLEET.FLEET_ID WHERE FLEET.FLEET_ID IN("+ fleetIds + ")";
    log.debug ("Query: "+sql);
    connection.query(sql, function(error, rows)
    {
      if(error)
      {
        callback(error, null);
      }
      else
      {
        callback(null, rows);
      }
    });
  } else {
    callback(null, null);
  }
}

// Obtener todos las trackings1 de un vehiculo
trackingModel.getTracking1FromVehicle = function(deviceId, callback)
{  
  if (connection) {
    var sql = "select TRACKING_1.TRACKING_ID as id, TRACKING_1.DEVICE_ID as deviceId, IFNULL(ROUND(TRACKING_1.GPS_SPEED,1), 0) as speed, IFNULL(ROUND(TRACKING_1.ALTITUDE), 0) as altitude, IFNULL(TRACKING_1.HEADING, 0) as heading, (TRACKING_1.POS_LATITUDE_DEGREE + TRACKING_1.POS_LATITUDE_MIN/60) as latitude, (POS_LONGITUDE_DEGREE + TRACKING_1.POS_LONGITUDE_MIN/60) as longitude, DATE_FORMAT(FROM_UNIXTIME(FLOOR(TRACKING_1.POS_DATE/1000)), '%Y-%m-%dT%H:%m:%sZ') as trackingDate from TRACKING_1 WHERE DEVICE_ID='"+ deviceId + "'";
    log.debug ("Query: "+sql);
    connection.query(sql, function(error, rows)
    {
      if(error)
      {
        callback(error, null);
      }
      else
      {
        callback(null, rows);
      }
    });
  } else {
    callback(null, null);
  }
}

// Obtener todos las trackings1 de una lista de vehiculos
trackingModel.getTracking1FromVehicles = function(vehicleIds, callback)
{  
  if (connection) {
    var sql = "select TRACKING_1.TRACKING_ID as id, TRACKING_1.DEVICE_ID as deviceId, IFNULL(ROUND(TRACKING_1.GPS_SPEED,1), 0) as speed, IFNULL(ROUND(TRACKING_1.ALTITUDE), 0) as altitude, IFNULL(TRACKING_1.HEADING, 0) as heading, (TRACKING_1.POS_LATITUDE_DEGREE + TRACKING_1.POS_LATITUDE_MIN/60) as latitude, (POS_LONGITUDE_DEGREE + TRACKING_1.POS_LONGITUDE_MIN/60) as longitude, DATE_FORMAT(FROM_UNIXTIME(FLOOR(TRACKING_1.POS_DATE/1000)), '%Y-%m-%dT%H:%m:%sZ') as trackingDate from TRACKING_1 LEFT JOIN HAS ON TRACKING_1.DEVICE_ID=HAS.DEVICE_ID LEFT JOIN FLEET ON HAS.FLEET_ID=FLEET.FLEET_ID WHERE TRACKING_1.DEVICE_ID IN("+ vehicleIds + ")";
    log.debug ("Query: "+sql);
    connection.query(sql, function(error, rows)
    {
      if(error)
      {
        callback(error, null);
      }
      else
      {
        callback(null, rows);
      }
    });
  } else {
    callback(null, null);
  }
}

// Obtener tracking historico de un vehiculo
trackingModel.getTrackingFromVehicle = function(deviceId, initDate, endDate, callback)
{  
  if (connection) {
    var initEpoch = moment(initDate,'YYYY-MM-DDTHH:mm:ssZ');
    var endEpoch = moment(endDate,'YYYY-MM-DDTHH:mm:ssZ');

    var sql = "select TRACKING_ID as id, DEVICE_ID as deviceId, IFNULL(ROUND(GPS_SPEED,1), 0) as speed, IFNULL(ROUND(ALTITUDE), 0) as altitude, IFNULL(HEADING, 0) as heading, (POS_LATITUDE_DEGREE + POS_LATITUDE_MIN/60) as latitude, (POS_LONGITUDE_DEGREE + POS_LONGITUDE_MIN/60) as longitude, DATE_FORMAT(FROM_UNIXTIME(FLOOR(POS_DATE/1000)), '%Y-%m-%dT%H:%m:%sZ') as trackingDate from TRACKING WHERE DEVICE_ID='"+ deviceId + "'" +
    " and POS_DATE>" + initEpoch + 
    " and POS_DATE<" + endEpoch + 
    " order by POS_DATE desc limit 1000";
    log.info ("Query: "+sql);
    connection.query(sql, function(error, rows)
    {
      if(error)
      {
        callback(error, null);
      }
      else
      {
        callback(null, rows);
      }
    });
  } else {
    callback(null, null);
  }
}













// Obtener todos las trackings
trackingModel.getTrackings = function(startRow, endRow, sortBy, callback)
{  if (connection)
  {
    var sqlCount = 'SELECT count(*) as nrows FROM TRACKING';
    log.debug ("Query: "+sqlCount);
    connection.query(sqlCount, function(err, row)
    {
      if(row)
      {
        var consulta = "select TRACKING.TRACKING_ID as id, DEVICE_ID as elementId, TRACKING.GPS_SPEED as speed, TRACKING.ALTITUDE as altitude, TRACKING.HEADING as heading, (POS_LATITUDE_DEGREE + POS_LATITUDE_MIN/60) as latitude, (POS_LONGITUDE_DEGREE + POS_LONGITUDE_MIN/60) as longitude, DATE_FORMAT(FROM_UNIXTIME(FLOOR(POS_DATE/1000)), '%Y-%m-%dT%H:%m:%sZ') as trackingDate from TRACKING"
        var totalRows = row[0].nrows;

        var sql = '';
        var orderBy = '';

        if (sortBy == null) {
          orderBy = 'trackingDate desc';
        }
        else {
          vsortBy = sortBy.split(',');
          for (var i=0; i<vsortBy.length; i++ ) {
            if (vsortBy[i].charAt(0) == '-') {
              var element = vsortBy[i].substring(1, vsortBy[i].length);
              if (element == 'id' || element == 'altitude' || element == 'elementId' || element == 'speed' || element == 'heading' || element == 'latitude' || element == 'logitude' || element == 'trackingDate')
              {
                if (orderBy == '')
                orderBy = element + ' desc';
                else
                orderBy = orderBy + ',' + element + ' desc';
              }
            } else {
              var element = vsortBy[i];
              if (element == 'id' || element == 'altitude' || element == 'elementId' || element == 'speed' || element == 'heading' || element == 'latitude' || element == 'logitude' || element == 'trackingDate')
              {
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

        log.debug ("Query: "+sql);

        connection.query(sql, function(error, rows)
        {
          if(error)
          {
            callback(error, null);
          }
          else
          {
            callback(null, rows, totalRows);
          }
        });
      }
      else
      {
        callback(null,[]);
      }
    });
  }
  else {
    callback(null, null);
  }
}

// Obtener un tracking por su id
trackingModel.getTracking = function(id,callback)
{
  if (connection) {
    var sql = "select TRACKING.TRACKING_ID as id, DEVICE_ID as elementId, TRACKING.GPS_SPEED as speed, TRACKING.ALTITUDE as altitude, TRACKING.HEADING as heading, (POS_LATITUDE_DEGREE + POS_LATITUDE_MIN/60) as latitude, (POS_LONGITUDE_DEGREE + POS_LONGITUDE_MIN/60) as longitude, DATE_FORMAT(FROM_UNIXTIME(FLOOR(POS_DATE/1000)), '%Y-%m-%dT%H:%m:%sZ') as trackingDate from TRACKING WHERE TRACKING.TRACKING_ID = "  + connection.escape(id);

    log.debug ("Query: "+sql);
    connection.query(sql, function(error, row)
    {
      if(error)
      {
        callback(error, null);
      }
      else
      {
        callback(null, row);
      }
    });
  } else {
    callback(null, null);
  }
}

//añadir una nuevo tracking
trackingModel.insertTracking = function(trackingData,callback)
{
  var coordenadas = kcoords(beaconData.latitude, beaconData.longitude);
  var lat = coordenadas.substring(0, coordenadas.indexOf(','));
  var lon = coordenadas.substring(coordenadas.indexOf(',')+1, coordenadas.length);
  var latdeg = lat.substring(0, lat.indexOf('|'));
  var latmin = lat.substring(lat.indexOf('|')+1, lat.length);
  var londeg = lon.substring(0, lon.indexOf('|'));
  var lonmin = lon.substring(lon.indexOf('|')+1, lon.length);

  //Fecha de la posicion: el momento actual
  var milliseconds_now = (new Date).getTime();

  if (connection)
  {
    var sql = "INSERT INTO TRACKING SET GPS_SPEED = " + connection.escape(trackingData.speed) + "," +
    'ALTITUDE = ' + connection.escape(trackingData.altitude) + ',' +
    'HEADING = ' + connection.escape(trackingData.heading) + ',' +
    'POS_DATE = ' + milliseconds_now + ',' +
    "POS_LATITUDE_DEGREE = " + latdeg + "," +
    "POS_LATITUDE_MIN = " + latmin + "," +
    "POS_LONGITUDE_DEGREE = " + londeg + "," +
    "POS_LONGITUDE_MIN = " + lonmin;

    log.debug ("Query: "+sql);
    connection.query(sql, function(error, result)
    {
      if(error)
      {
        callback(error, null);
      }
      else
      {
        var trackingInsertId = result.insertId;

        // Insertar en tracking_1
        var sqlTracking1 = "UPDATE TRACKING_1 SET GPS_SPEED = " + connection.escape(trackingData.speed) + "," +
        'ALTITUDE = ' + connection.escape(trackingData.altitude) + ',' +
        'HEADING = ' + connection.escape(trackingData.heading) + ',' +
        'POS_DATE = ' + milliseconds_now + ',' +
        "POS_LATITUDE_DEGREE = " + latdeg + "," +
        "POS_LATITUDE_MIN = " + latmin + "," +
        "POS_LONGITUDE_DEGREE = " + londeg + "," +
        "POS_LONGITUDE_MIN = " + lonmin + " " +
        "where TRACKING_ID = " + trackingInsertId;

        connection.query(sqlTracking1, function(error, result)
        {
          if(error)
          {
            callback(error, null);
          }
          else
          {
            // Insertar en tracking_5
            var sqlTracking5 = "UPDATE TRACKING_5 SET GPS_SPEED = " + connection.escape(trackingData.speed) + "," +
            'ALTITUDE = ' + connection.escape(trackingData.altitude) + ',' +
            'HEADING = ' + connection.escape(trackingData.heading) + ',' +
            'POS_DATE = ' + milliseconds_now + ',' +
            "POS_LATITUDE_DEGREE = " + latdeg + "," +
            "POS_LATITUDE_MIN = " + latmin + "," +
            "POS_LONGITUDE_DEGREE = " + londeg + "," +
            "POS_LONGITUDE_MIN = " + lonmin + " " +
            "where TRACKING_ID = " + trackingInsertId;

            connection.query(sqlTracking5, function(error, result)
            {
              if(error)
              {
                callback(error, null);
              }
              else {
                //devolvemos la última id insertada
                callback(null,{"insertId" : connection.escape(trackingInsertId)});
              }
            });
          }
        });
      }
    });
  }
  else
  {
    callback(null, null);
  }
}

// Actualizar un tracking
trackingModel.updateTracking = function(trackingData, callback)
{
  var coordenadas = kcoords(beaconData.latitude, beaconData.longitude);
  var lat = coordenadas.substring(0, coordenadas.indexOf(','));
  var lon = coordenadas.substring(coordenadas.indexOf(',')+1, coordenadas.length);
  var latdeg = lat.substring(0, lat.indexOf('|'));
  var latmin = lat.substring(lat.indexOf('|')+1, lat.length);
  var londeg = lon.substring(0, lon.indexOf('|'));
  var lonmin = lon.substring(lon.indexOf('|')+1, lon.length);

  if (connection)
  {
    var sql = "UPDATE TRACKING SET GPS_SPEED = " + connection.escape(trackingData.speed) + "," +
    'ALTITUDE = ' + connection.escape(trackingData.altitude) + ',' +
    'HEADING = ' + connection.escape(trackingData.heading) + ',' +
    "POS_LATITUDE_DEGREE = " + latdeg + "," +
    "POS_LATITUDE_MIN = " + latmin + "," +
    "POS_LONGITUDE_DEGREE = " + londeg + "," +
    "POS_LONGITUDE_MIN = " + lonmin + " " +
    "where TRACKING_ID = " + trackingData.id;

    log.debug ("Query: "+sql);
    connection.query(sql, function(error, result)
    {
      if(error)
      {
        callback(error, null);
      }
      else
      {
        // actualizar en tracking_1
        var sqlTracking1 = "UPDATE TRACKING_1 SET GPS_SPEED = " + connection.escape(trackingData.speed) + "," +
        'ALTITUDE = ' + connection.escape(trackingData.altitude) + ',' +
        'HEADING = ' + connection.escape(trackingData.heading) + ',' +
        'POS_DATE = ' + milliseconds_now + ',' +
        "POS_LATITUDE_DEGREE = " + latdeg + "," +
        "POS_LATITUDE_MIN = " + latmin + "," +
        "POS_LONGITUDE_DEGREE = " + londeg + "," +
        "POS_LONGITUDE_MIN = " + lonmin + " " +
        "where TRACKING_ID = " + trackingData.id;

        connection.query(sqlTracking1, function(error, result)
        {
          if(error)
          {
            callback(error, null);
          }
          else
          {
            // actualizar en tracking_5
            var sqlTracking5 = "UPDATE TRACKING_5 SET GPS_SPEED = " + connection.escape(trackingData.speed) + "," +
            'ALTITUDE = ' + connection.escape(trackingData.altitude) + ',' +
            'HEADING = ' + connection.escape(trackingData.heading) + ',' +
            'POS_DATE = ' + milliseconds_now + ',' +
            "POS_LATITUDE_DEGREE = " + latdeg + "," +
            "POS_LATITUDE_MIN = " + latmin + "," +
            "POS_LONGITUDE_DEGREE = " + londeg + "," +
            "POS_LONGITUDE_MIN = " + lonmin + " " +
            "where TRACKING_ID = " + trackingData.id;

            connection.query(sqlTracking5, function(error, result)
            {
              if(error)
              {
                callback(error, null);
              }
              else {
                callback(null,{"message":"success"});
              }
            });
            }
        });
      }
    });
  }
  else
  {
    callback(null, null);
  }
}


// Eliminar un tracking pasando la id a eliminar
trackingModel.deleteTracking = function(id, callback)
{
  if(connection)
  {
    var sqlExists = "select TRACKING.TRACKING_ID as id, DEVICE_ID as elementId, TRACKING.GPS_SPEED as speed, TRACKING.ALTITUDE as altitude, TRACKING.HEADING as heading, (POS_LATITUDE_DEGREE + POS_LATITUDE_MIN/60) as latitude, (POS_LONGITUDE_DEGREE + POS_LONGITUDE_MIN/60) as longitude, DATE_FORMAT(FROM_UNIXTIME(FLOOR(POS_DATE/1000)), '%Y-%m-%dT%H:%m:%s.%SZ') as trackingDate from TRACKING WHERE TRACKING.TRACKING_ID = "  + connection.escape(id);

    log.debug ("Query: "+sqlExists);
    connection.query(sqlExists, function(err, row)
    {
      //si existe la id del tracking a eliminar
      if(row)
      {
        var sql = "DELETE FROM TRACKING WHERE TRACKING_ID = " + connection.escape(id);
        connection.query(sql, function(error, result)
        {
          if(error)
          {
            callback(error, null);
          }
          else
          {
            // Eliminar de tracking_!
            var sqltracking1 = "DELETE FROM TRACKING_1 WHERE TRACKING_ID = " + connection.escape(id);
            connection.query(sqltracking1, function(error, result)
            {
              var sqltracking5 = "DELETE FROM TRACKING_5 WHERE TRACKING_ID = " + connection.escape(id);
              connection.query(sqltracking1, function(error, result)
              {
                // se devuelven los datos del elemento eliminado
                callback(null,row);
              });
            });
          }
        });
      }
      else
      {
        callback(null,{"message":"notExist"});
      }
    });
  }
  else {
    callback(null, null);
  }
}

//extrackingamos el objeto para tenerlo disponible en la zona de rutas
module.exports = trackingModel;
