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
var routeModel = {};

//obtener todos
routeModel.getRoutes = function(startRow, endRow, sortBy, callback)
{
  if (connection)
  {
    var sqlCount = 'SELECT count(*) as nrows FROM BEACON';
    log.debug ("Query: "+sqlCount);
    connection.query(sqlCount, function(err, row)
    {
      if(row)
      {
        var consulta = "SELECT ID as id, DESCRIPTION as description, DATE_FORMAT(FROM_UNIXTIME(FLOOR(START_DATE/1000)), '%Y-%m-%dT%TZ') as initDate, DATE_FORMAT(FROM_UNIXTIME(FLOOR(END_DATE/1000)), '%Y-%m-%dT%TZ') as endDate, ROUTE_TYPE as typeRoute FROM ROUTE";

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
              if (element == 'id' || element == 'description' || element == 'routeType' || element == 'initDate' || element == 'endDate')
              {
                if (orderBy == '')
                  orderBy = element + ' desc';
                else
                  orderBy = orderBy + ',' + element + ' desc';
              }
            } else {
              var element = vsortBy[i];
              if (element == 'id' || element == 'description' || element == 'routeType' || element == 'initDate' || element == 'endDate')
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
routeModel.getRoute = function(id,callback)
{
    if (connection)
    {
        var sqlQuery = "SELECT ID as id, DESCRIPTION as description, DATE_FORMAT(FROM_UNIXTIME(FLOOR(START_DATE/1000)), '%Y-%m-%dT%TZ') as initDate, DATE_FORMAT(FROM_UNIXTIME(FLOOR(END_DATE/1000)), '%Y-%m-%dT%TZ') as endDate, ROUTE_TYPE as typeRoute FROM ROUTE where ID="+ connection.escape(id);
        log.debug ("Query: "+sqlQuery);
        connection.query(sqlQuery, function(error, row)
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
routeModel.insertRoute = function(routeData,callback)
{
    if (connection)
    {
        var sql = "INSERT INTO ROUTE SET DESCRIPTION = " + connection.escape(routeData.description) + "," +
        "START_DATE = DATE_FORMAT(" + connection.escape(routeData.initDate) + ", '%Y-%m-%dT%TZ')," +
        "END_DATE = DATE_FORMAT(" + connection.escape(routeData.endDate) + ", '%Y-%m-%dT%TZ')," +
        "ROUTE_TYPE = " + connection.escape(routeData.routeType) + "," +
        "USER_NAME = 'sumoAPI'";

        connection.query(sql, function(error, result)
        {
            if(error)
            {
                callback(error, null);
            }
            else
            {
                //insertar en tabla ROUTE_FLEET
                var routeId = result.insertId;

                var sql = 'INSERT INTO ROUTE_FLEET SET FLEET_ID = ' + properties.get('fleet.safety.id ') + ',' +
                'ROUTE_ID = ' + routeId;
                connection.query(sql, function(error, result){});
                var sql = 'INSERT INTO ROUTE_FLEET SET FLEET_ID = ' + properties.get('fleet.ctv.id ') + ',' +
                'ROUTE_ID = ' + routeId;
                connection.query(sql, function(error, result){});
                var sql = 'INSERT INTO ROUTE_FLEET SET FLEET_ID = ' + properties.get('fleet.others.id ') + ',' +
                'ROUTE_ID = ' + routeId;
                connection.query(sql, function(error, result){});

                // TODO. Hacer roolback si hay error en esta segunda insercion?

                //devolvemos la última id insertada
                callback(null,{"insertId" : routeId});
            }
        });
    }
    else {
      callback(null, null);
    }
}

//actualizar
routeModel.updateRoute = function(routeData, callback)
{
    if(connection)
    {
        var sql = "UPDATE ROUTE SET DESCRIPTION = " + connection.escape(routeData.description) + "," +
        "START_DATE = DATE_FORMAT(" + connection.escape(routeData.initDate) + ", '%Y-%m-%dT%TZ')," +
        "END_DATE = DATE_FORMAT(" + connection.escape(routeData.endDate) + ", '%Y-%m-%dT%TZ')," +
        "ROUTE_TYPE = " + connection.escape(routeData.routeType) + " " +
        "WHERE ID = " + routeData.id;

        //console.log(sql);
        log.debug ("[models-route]. Query: "+sql);

        connection.query(sql, function(error, result)
        {
            if(error)
            {
                callback(error, null);
            }
            else
            {
                log.debug ("[models-vessels]. Success !");

                callback(null,{"message":"success"});
            }
        });
    }
    else {
      callback(null, null);
    }
}

//eliminar 1
routeModel.deleteRoute = function(id, callback)
{
    if(connection)
    {
        var sqlExists = 'SELECT ID as id, DESCRIPTION as description, START_DATE as initDate, END_DATE as endDate, ROUTE_TYPE as typeRoute FROM ROUTE WHERE id = ' + connection.escape(id);
        log.debug ("Query: "+sqlExists);

        connection.query(sqlExists, function(err, row)
        {
            if(row)
            {
                var sql = 'DELETE FROM ROUTE WHERE id = ' + connection.escape(id);
                log.debug ("Query: "+sql);

                connection.query(sql, function(error, result)
                {
                    if(error)
                    {
                        callback(error, null);
                    }
                    else
                    {
                        // Borrar de la tabla ROUTE_FLEET
                        var sqlHas = 'DELETE FROM ROUTE_FLEET WHERE ROUTE_ID = ' + connection.escape(id);
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
module.exports = routeModel;
