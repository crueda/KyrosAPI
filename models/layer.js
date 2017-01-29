// Fichero de propiedades
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
var layerModel = {};

// Obtener todos
layerModel.getLayers = function(startRow, endRow, sortBy, callback)
{
  if (connection)
  {
    var sqlCount = "SELECT count(*) as nrows FROM CARTOGRAPHY_LAYER";
    log.debug ("Query: "+sqlCount);
    connection.query(sqlCount, function(err, row)
    {
      if(row)
      {
        var consulta = "SELECT ID as id, LAYER_NAME as name, LAYER_SHOW_NAME as showName, LAYER_SHOW_NAME as showName, IS_VISIBLE as visible, IS_TRANSPARENT as transparent FROM CARTOGRAPHY_LAYER";

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
              if (element == 'id' || element == 'name' || element == 'showName' || element == 'visible' || element == 'transparent')
              {
                if (orderBy == '')
                  orderBy = element + ' desc';
                else
                  orderBy = orderBy + ',' + element + ' desc';
              }
            } else {
              var element = vsortBy[i];
              if (element == 'id' || element == 'name' || element == 'showName' || element == 'visible' || element == 'transparent')
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

// Obtener un layer por su id
layerModel.getLayer = function(id,callback)
{
    if (connection)
    {
        var sql = "SELECT ID as id, WMS_URL_OUTSIDE as url, LAYER_NAME as name, LAYER_SHOW_NAME as showName, IS_VISIBLE as visible, IS_TRANSPARENT as transparent FROM CARTOGRAPHY_LAYER WHERE ID=" + connection.escape(id);
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

// Actualizar un layer
layerModel.updateLayer = function(layerData, callback)
{
    if(connection)
    {
        var sql = 'UPDATE CARTOGRAPHY_LAYER SET ' +
        'LAYER_SHOW_NAME = ' + connection.escape(layerData.showName) + ',' +
        'LAYER_NAME = ' + connection.escape(layerData.name) + ',' +
        'IS_VISIBLE = ' + connection.escape(layerData.visible) + ',' +
        'IS_TRANSPARENT = ' + connection.escape(layerData.transparent) + ' ' +
        'WHERE ID = ' + layerData.id;

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

//añadir una nuevo layer
layerModel.insertLayer = function(layerData,callback)
{
    if (connection)
    {
        var sql = 'INSERT INTO CARTOGRAPHY_LAYER SET ' +
        'LAYER_SHOW_NAME = ' + connection.escape(layerData.showName) + ',' +
        'LAYER_NAME = ' + connection.escape(layerData.name) + ',' +
        'IS_VISIBLE = ' + connection.escape(layerData.visible) + ',' +
        'IS_TRANSPARENT = ' + connection.escape(layerData.transparent);

        log.debug ("Query: "+sql);
        connection.query(sql, function(error, result)
        {
            if(error)
            {
               callback(null, null);
            }
            else
            {
              //devolvemos la última id insertada
              callback(null,{"insertId" : result.insertId});
            }
        });
    }
    else
    {
      callback(null, null);
    }
}

// Eliminar un layer pasando la id a eliminar
layerModel.deleteLayer = function(id, callback)
{
    if(connection) {
        var sqlExists = 'SELECT ID as id, LAYER_NAME as name, LAYER_SHOW_NAME as showName, LAYER_SHOW_NAME as showName, IS_VISIBLE as visible, IS_TRANSPARENT as transparent FROM CARTOGRAPHY_LAYER WHERE ID = ' + connection.escape(id);

        log.debug ("Query: "+sqlExists);
        connection.query(sqlExists, function(err, row)
        {
            //si existe la id del layer a eliminar
            if(row) {
                var sqlPoi = 'DELETE FROM CARTOGRAPHY_LAYER WHERE ID = ' + connection.escape(id);

                log.debug ("Query: "+sqlPoi);

                connection.query(sqlPoi, function(error, result)
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
module.exports = layerModel;
