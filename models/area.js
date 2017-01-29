var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('./api.properties');


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

//creamos un objeto para ir almacenando todo lo que necesitemos
var areaModel = {};

//obtenemos todos las areas
areaModel.getAreas = function(startRow, endRow, sortBy, callback)
{
    if (connection)
    {
      var sqlCount = "SELECT count(*) as nrows FROM AREA";
      log.debug ("Query: "+sqlCount);
      connection.query(sqlCount, function(err, row)
      {
        if(row)
        {
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
                if (element == 'id' || element == 'description' || element == 'initDate'  || element == 'endDate'  || element == 'initHour'  || element == 'endHour'  || element == 'typeArea'  || element == 'radius')
                {
                  if (orderBy == '')
                    orderBy = element + ' desc';
                  else
                    orderBy = orderBy + ',' + element + ' desc';
                }
              } else {
                var element = vsortBy[i];
                if (element == 'id' || element == 'description' || element == 'initDate'  || element == 'endDate'  || element == 'initHour'  || element == 'endHour'  || element == 'typeArea'  || element == 'radius')
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
            sql = "SELECT ID as id, DESCRIPTION as description, DATE_FORMAT(FROM_UNIXTIME(FLOOR(DATE_INIT/1000)), '%Y-%m-%dT') as initDate, DATE_FORMAT(FROM_UNIXTIME(FLOOR(DATE_END/1000)), '%Y-%m-%dT') as endDate, HOUR_INIT as initHour, HOUR_END as endHour, TYPE_AREA as typeArea, RADIUS as radius, USER_NAME as username FROM AREA ORDER BY " + orderBy;
          }
          else {
            sql = "SELECT ID as id, DESCRIPTION as description, DATE_FORMAT(FROM_UNIXTIME(FLOOR(DATE_INIT/1000)), '%Y-%m-%dT') as initDate, DATE_FORMAT(FROM_UNIXTIME(FLOOR(DATE_END/1000)), '%Y-%m-%dT') as endDate, HOUR_INIT as initHour, HOUR_END as endHour, TYPE_AREA as typeArea, RADIUS as radius, USER_NAME as username FROM AREA ORDER BY " + orderBy + " LIMIT " + (endRow - startRow + 1) + " OFFSET " + startRow;
          }

          log.debug ("Query: "+sql);
          connection.query(sql, function(error, rows)
          {
              if(error)
              {
                  callback(error, {"message":"notExist"});
              }
              else
              {
                  callback(null, rows, totalRows);
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

//obtenemos un area por su id
areaModel.getArea = function(id,callback)
{
    if (connection)
    {
        var sql = "SELECT ID as id, DESCRIPTION as description, DATE_FORMAT(FROM_UNIXTIME(FLOOR(DATE_INIT/1000)), '%Y-%m-%dT') as initDate, DATE_FORMAT(FROM_UNIXTIME(FLOOR(DATE_END/1000)), '%Y-%m-%dT') as endDate, HOUR_INIT as initHour, HOUR_END as endHour, TYPE_AREA as typeArea, RADIUS as radius, USER_NAME as username  FROM AREA WHERE id = " + connection.escape(id);

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

//añadir una nueva area
areaModel.insertArea = function(areaData,callback)
{
    if (connection)
    {
        var sql = "INSERT INTO AREA SET DESCRIPTION = " + connection.escape(areaData.description) + "," +
        "DATE_INIT = " + "DATE_FORMAT(FROM_UNIXTIME(" + connection.escape(areaData.initDate) + "), '%Y-%m-%d')" + "," +
        "DATE_END = " + "DATE_FORMAT(FROM_UNIXTIME(" + connection.escape(areaData.endDate) + "), '%Y-%m-%d')" + "," +
        "HOUR_INIT = " + connection.escape(areaData.initHour) + "," +
        "HOUR_END = " + connection.escape(areaData.endHour) + "," +
        "TYPE_AREA = " + connection.escape(areaData.typeArea) + "," +
        "RADIUS = " + connection.escape(areaData.radius) + "," +
        "USER_NAME = \'kyrosAPI\'";

        log.debug ("Query: "+sql);

        connection.query(sql, function(error, result)
        {
            if(error)
            {
                callback(error, null);
            }
            else
            {
                //devolvemos la última id insertada
                callback(null,{"insertId" : areaId});
            }
        });
    }
    else {
      callback(null, null);
    }
}

//actualizar un area
areaModel.updateArea = function(areaData, callback)
{
    if(connection)
    {
        var sql = "UPDATE AREA SET DESCRIPTION = " + connection.escape(areaData.description) + "," +
        "TYPE_AREA = " + connection.escape(areaData.typeArea) + "," +
        "DATE_INIT = " + "DATE_FORMAT(FROM_UNIXTIME(" + connection.escape(areaData.initDate) + "), '%Y-%m-%d')" + "," +
        "DATE_END = " + "DATE_FORMAT(FROM_UNIXTIME(" + connection.escape(areaData.endDate) + "), '%Y-%m-%d')" + "," +
        "HOUR_INIT = " + connection.escape(areaData.initHour) + "," +
        "HOUR_END = " + connection.escape(areaData.endHour) + "," +
        "RADIUS = " + connection.escape(areaData.radius) + " " +
        "WHERE id = " + areaData.id;

        log.debug ("Query: "+sql);

        connection.query(sql, function(error, result)
        {
            if(error)
            {
                callback(error, null);
            }
            else
            {
                callback(null,{"message":"success"});
            }
        });
    }
    else {
      callback(null, null);
    }
}

//eliminar un area pasando la id a eliminar
areaModel.deleteArea = function(id, callback)
{
    if(connection)
    {
        var sqlExists = "SELECT ID as id, DESCRIPTION as description, DATE_FORMAT(FROM_UNIXTIME(FLOOR(DATE_INIT/1000)), '%Y-%m-%dT') as initDate, DATE_FORMAT(FROM_UNIXTIME(FLOOR(DATE_END/1000)), '%Y-%m-%dT') as endDate, HOUR_INIT as initHour, HOUR_END as endHour, TYPE_AREA as typeArea, RADIUS as radius, USER_NAME as username FROM AREA WHERE ID = " + connection.escape(id);

        log.debug ("Query: "+sqlExists);

        connection.query(sqlExists, function(err, row)
        {
            //si existe la id del area a eliminar
            if(row)
            {
                var sql = 'DELETE FROM AREA WHERE ID = ' + connection.escape(id);

                log.debug ("Query: "+sql);

                connection.query(sql, function(error, result)
                {
                    if(error)
                    {
                        callback(error, null);                    }
                    else
                    {
                        // Borrar de la tabla AREA_FLEET
                        var sqlHas = 'DELETE FROM AREA_FLEET WHERE AREA_ID = ' + connection.escape(id);

                        log.debug ("Query: "+sqlHas);

                        connection.query(sqlHas, function(error, result)
                        {
                            if(error)
                            {
                                callback(error, null);
                            }
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
module.exports = areaModel;
