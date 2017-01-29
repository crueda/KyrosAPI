var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('./api.properties');
var moment = require("moment");

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

var dbConfig = {
  host: properties.get('bbdd.mysql.ip') ,
  user: properties.get('bbdd.mysql.user') ,
  password: properties.get('bbdd.mysql.passwd') ,
  database: properties.get('bbdd.mysql.name'),
    connectionLimit: 50,
    queueLimit: 0,
    waitForConnection: true
};

var mysql = require('mysql');

// Crear la conexion a la base de datos
var connection = mysql.createPool(dbConfig);

//crear un objeto para ir almacenando todo lo que necesitemos
var vehicleModel = {};

//obtener todos
vehicleModel.getVehicles = function(startRow, endRow, sortBy, callback)
{
  if (connection)
  {
    var sqlCount = "SELECT count (*) as nrows FROM VEHICLE V, HAS H, FLEET F where V.DEVICE_ID=H.DEVICE_ID and H.FLEET_ID=F.FLEET_ID" ;

    log.debug ("Query: "+sqlCount);
    connection.query(sqlCount, function(err, row)
    {
      if(row)
      {
        var consulta = "SELECT V.DEVICE_ID as id, V.ALIAS as alias, V.VEHICLE_LICENSE as license FROM VEHICLE V, HAS H, FLEET F where V.DEVICE_ID=H.DEVICE_ID and H.FLEET_ID=F.FLEET_ID";
        var totalRows = row[0].nrows;

        var sql = '';
        var orderBy = '';

        if (sortBy == null) {
          orderBy = 'id';
        }
        else {
          vsortBy = sortBy.split(',');
          for (var i=0; i<vsortBy.length; i++ ) {
            if (vsortBy[i].charAt(0) == '-') {
              var element = vsortBy[i].substring(1, vsortBy[i].length);
              if (element == 'id' || element == 'license' || imo == 'alias' || email == 'fleetId')
              {
                if (orderBy == '')
                  orderBy = element + ' desc';
                else
                  orderBy = orderBy + ',' + element + ' desc';
              }
            } else {
              var element = vsortBy[i];
              if (element == 'id' || element == 'license' || imo == 'alias' || email == 'fleetId')
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

//obtenemos 1
vehicleModel.getVehicle = function(id,callback)
{
    if (connection)
    {
        var sql = "SELECT V.DEVICE_ID as id, V.ALIAS as alias, V.VEHICLE_LICENSE as license FROM VEHICLE V, HAS H, FLEET F where V.DEVICE_ID=H.DEVICE_ID and V.DEVICE_ID = " + connection.escape(id);
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
    }
    else {
      callback(null, null);
    }
}

//añadir 1 nuevo
vehicleModel.insertVehicle = function(vehicleData,callback)
{
    if (connection)
    {
        var now = moment(new Date());

        var sql = "INSERT INTO VEHICLE SET VEHICLE_LICENSE = " + connection.escape(vehicleData.license) + "," +
        "ALIAS = " + connection.escape(vehicleData.alias);

        log.debug ("Query: "+ sql);
        connection.query(sql, function(error, result)
        {
            if(error)
            {
                callback(error, null);
            }
            else
            {
                var deviceId =  result.insertId;

                //insertar en tabla OBT
                var sqlObt = 'INSERT INTO OBT SET IMEI = ' + connection.escape(vehicleData.imei) + ',' +
                'VERSION_ID = ' + '11' + ',' +
                'DEVICE_ID = ' + deviceId + ',' +
                'VEHICLE_LICENSE = ' + connection.escape(vehicleData.license) + ',' +
                'GSM_OPERATOR_ID = ' + '0'+ ',' +
                'ID_CARTOGRAPHY_LAYER = ' + '0'+ ',' +
                'ID_TIME_ZONE = ' + '1'+ ',' +
                'TYPE_SPECIAL_OBT = ' + '0'+ ',' +
                'LOGGER = ' + '0';

                log.debug ("Query: "+ sqlObt);
                connection.query(sqlObt, function(error, result)
                {
                    if(error)
                    {
                        callback(error, null);
                    }
                    else{
                      //insertar en tabla HAS
                      var sqlHas = "INSERT INTO HAS SET FLEET_ID = " + connection.escape(vehicleData.fleetId) + ',' +
                      "DEVICE_ID = " + deviceId + "," +
                      "VEHICLE_LICENSE = " + connection.escape(vehicleData.license);

                      log.debug ("Query: "+ sqlHas);
                      connection.query(sqlHas, function(error, result)
                      {
                          if(error)
                          {
                              callback(error, null);
                          }
                          else
                          {

                            //devolvemos la última id insertada
                            callback(null,{"insertId" : deviceId});
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
}

//actualizar
vehicleModel.updateVehicle = function(vehicleData, callback)
{
    if(connection)
    {
        var sql = "UPDATE VEHICLE SET ALIAS = " + connection.escape(vehicleData.alias) + " " +
        "WHERE DEVICE_ID = " + vehicleData.id;

        //console.log(sql);
        log.debug ("Query: "+sql);
        connection.query(sql, function(error, result)
        {
            if(error)
            {
                callback(error, null);
            }
            else
            {
                // Actualizar la tabla HAS
                var sqlHas = "UPDATE HAS SET FLEET_ID = " + connection.escape(vehicleData.fleetId) + " "  +
                "WHERE DEVICE_ID = " + vehicleData.id;

                log.debug ("Query: "+ sqlHas);
                connection.query(sqlHas, function(error, result)
                {
                    if(error)
                    {
                        callback(error, null);
                    }
                    else
                    {
                      //devolvemos la última id insertada
                      callback(null,{"message":"success"});
                    }
                });
            }
        });
    }
    else {
      callback(null, null);
    }
}

//eliminar 1
vehicleModel.deleteVehicle = function(id, callback)
{
    if(connection)
    {
        var sqlExists = "SELECT V.DEVICE_ID as id, V.ALIAS as alias, V.VEHICLE_LICENSE as license FROM VEHICLE V, HAS H, FLEET F where V.DEVICE_ID=H.DEVICE_ID and V.DEVICE_ID = " + connection.escape(id);
        log.debug ("Query: "+sqlExists);
        connection.query(sqlExists, function(err, row)
        {
            if(row)
            {
                var sql = 'DELETE FROM VEHICLE WHERE DEVICE_ID = ' + connection.escape(id);
                log.debug ("Query: "+sql);

                connection.query(sql, function(error, result)
                {
                    if(error)
                    {
                        callback(error, null);                    }
                    else
                    {
                        // Borrar de la tabla HAS
                        var sqlHas = 'DELETE FROM HAS WHERE DEVICE_ID = ' + connection.escape(id);
                        log.debug ("Query: "+sqlHas);

                        connection.query(sqlHas, function(error, result)
                        {
                            if(error)
                            {
                                callback(error, null);                    }
                            else
                            {
                              // se devuelven los datos del elemento eliminado
                              callback(null,row);
                            }
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

//exportamos el objeto para tenerlo disponible en la zona de rutas
module.exports = vehicleModel;
