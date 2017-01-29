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

// Crear un objeto para ir almacenando todo lo necesario
var poiModel = {};

// Obtener todos los pois
poiModel.getPois = function(startRow, endRow, sortBy, callback)
{
  if (connection)
  {
    var sqlCount = "SELECT count(*) as nrows FROM POI";
    log.debug ("Query: "+sqlCount);
    connection.query(sqlCount, function(err, row)
    {
      if(row)
      {
        var consulta = "SELECT POI_ID as id, DESCRIPTION as description, NAME as name, CATEGORY_ID as categoryId, LATITUDE as latitude, LONGITUDE as longitude FROM POI";

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
              if (element == 'id' || element == 'description' || element == 'name' || element == 'categoryId' || element == 'longitude' || element == 'latitude')
              {
                if (orderBy == '')
                  orderBy = element + ' desc';
                else
                  orderBy = orderBy + ',' + element + ' desc';
              }
            } else {
              var element = vsortBy[i];
              if (element == 'id' || element == 'description' || element == 'name' || element == 'categoryId' || element == 'longitude' || element == 'latitude')
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

// Obtener un poi por su id
poiModel.getPoi = function(id,callback)
{
    if (connection)
    {
        var sql = "SELECT POI_ID as id, DESCRIPTION as description, NAME as name, CATEGORY_ID as categoryId, LATITUDE as latitude, LONGITUDE as longitude FROM POI WHERE POI_ID = " + connection.escape(id);
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
    else
    {
      callback(null, null);
    }
}

// Actualizar un poi
poiModel.updatePoi = function(poiData, callback)
{
    if(connection)
    {
        var sql = 'UPDATE POI SET DESCRIPTION = ' + connection.escape(poiData.description) + ',' +
        'NAME = ' + connection.escape(poiData.name) + ',' +
        'CATEGORY_ID = ' + connection.escape(poiData.categoryId) + ',' +
        'LATITUDE = ' + connection.escape(poiData.latitude) + ',' +
        'LONGITUDE = ' + connection.escape(poiData.longitude) + ' ' +
        'WHERE POI_ID = ' + poiData.id;

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
    else
    {
      callback(null, null);
    }
}

//añadir una nuevo poi
poiModel.insertPoi = function(poiData,callback)
{
    if (connection)
    {
        var sql = 'INSERT INTO POI SET DESCRIPTION = ' + connection.escape(poiData.description) + ',' +
        'DATE = ' + new Date().valueOf() + ',' +
        'CATEGORY_ID = ' + connection.escape(poiData.categoryId) + ',' +
        'NAME = ' + connection.escape(poiData.name) + ',' +
        'LATITUDE = ' + connection.escape(poiData.latitude) + ',' +
        'LONGITUDE = ' + connection.escape(poiData.longitude);

        log.debug ("Query: "+sql);
        connection.query(sql, function(error, result)
        {
            if(error)
            {
               callback(null, null);
            }
            else
            {
                var poiId = result.insertId;
                //devolvemos el id del poi insertada
                callback(null,{"insertId" : poiId});
            }
        });
    }
    else
    {
      callback(null, null);
    }
}

// Eliminar un poi pasando la id a eliminar
poiModel.deletePoi = function(id, callback)
{
    if(connection) {
        var sqlExists = "SELECT POI_ID as id, DESCRIPTION as description, NAME as name, CATEGORY_ID as categoryId, LATITUDE as latitude, LONGITUDE as longitude FROM POI WHERE POI_ID = " + connection.escape(id);

        log.debug ("Query: "+sqlExists);
        connection.query(sqlExists, function(err, row)
        {
            //si existe la id del poi a eliminar
            if(row) {
                var sqlPoi = "DELETE FROM POI WHERE POI_ID = " + connection.escape(id);
                log.debug ("Query: "+sqlPoi);
                connection.query(sqlPoi, function(error, result)
                {
                    if(error)
                    {
                      callback(error, null);
                    }
                    else
                    {
                      callback(null,row);
                    }
                });
            }
            else
            {
                callback(null,{"message":"notExist"});
            }
        });
    }
    else
    {
      callback(null, null);
    }
}

//exportamos el objeto para tenerlo disponible en la zona de rutas
module.exports = poiModel;
