var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('kyrosapi.properties');
var mongoose = require('mongoose');


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

var dbMongoName = properties.get('bbdd.mongo.name');
var dbMongoHost = properties.get('bbdd.mongo.ip');
var dbMongoPort = properties.get('bbdd.mongo.port');

mongoose.connect('mongodb://' + dbMongoHost + ':' + dbMongoPort + '/' + dbMongoName,  { server: { reconnectTries: 3, poolSize: 5 } }, function (error) {
  if (error) {
    log.info(error);
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

areaModel.getAreas = function(callback)
{
    mongoose.connection.db.collection('AREA', function (err, collection) {
      collection.find({},{ '_id': 0}).toArray(function (err, docs) {
          callback(null, docs);
      });
    });
}

areaModel.getArea = function (id, callback) {
  mongoose.connection.db.collection('AREA', function (err, collection) {
    collection.find({ 'id': parseInt(id) }, { '_id': 0}).toArray(function (err, docs) {
        callback(null, docs);
    });
  });
}




areaModel.getAreasMysql = function(startRow, endRow, sortBy, callback)
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
            var vsortBy = sortBy.split(',');
            for (var i=0; i<vsortBy.length; i++ ) {
              if (vsortBy[i].charAt(0) == '-') {
                let element = vsortBy[i].substring(1, vsortBy[i].length);
                if (element == 'id' || element == 'description' || element == 'initDate'  || element == 'endDate'  || element == 'initHour'  || element == 'endHour'  || element == 'typeArea'  || element == 'radius')
                {
                  if (orderBy == '')
                    orderBy = element + ' desc';
                  else
                    orderBy = orderBy + ',' + element + ' desc';
                }
              } else {
                let element = vsortBy[i];
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

areaModel.getAreaMysql = function(id,callback)
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

//exportamos el objeto para tenerlo disponible en la zona de rutas
module.exports = areaModel;
