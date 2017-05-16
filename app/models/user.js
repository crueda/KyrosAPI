var mongoose = require('mongoose');
var crypt     = require('crypt3');

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

// Crear la conexion a la base de datos
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
var pool = mysql.createPool(dbConfig);

var dbMongoName = properties.get('bbdd.mongo.name');
var dbMongoHost = properties.get('bbdd.mongo.ip');
var dbMongoPort = properties.get('bbdd.mongo.port');

mongoose.connect('mongodb://' + dbMongoHost + ':' + dbMongoPort + '/' + dbMongoName,  { server: { reconnectTries: 3, poolSize: 5 } }, function (error) {
    if (error) {
        log.info(error);
    } 
});

// Crear un objeto para ir almacenando todo lo necesario
var userModel = {};

userModel.login = function(username, password, callback)
{
    mongoose.connection.db.collection('USER', function (err, collection) {
        collection.find( { 'username': username}).toArray(function(err, docs) {
            if (docs!=undefined && docs.length>=0) {
                if (docs[0]== undefined) {
                    callback(null, {"status": "nok"});
                } else {
                    if( crypt(password, docs[0]['password']) !== docs[0]['password']) {
                        callback(null, {"status": "nok"});
                    } else {
                        mongoose.connection.db.collection('VEHICLE', function (err, collection) {
                            collection.find({'device_id': parseInt(docs[0]['device_id'])}).toArray(function(err, docsVehicle) {
                                if (docsVehicle!=undefined && docsVehicle[0]!=undefined) {
                                    docs[0].vehicle_license = docsVehicle[0].vehicle_license;    
                                }
                                callback(null, {"status": "ok", "result": docs});
                            });
                        });
                        
                    }
                }
            } else {
                callback(null, {"status": "nok"});
            }
        });
    });
}

userModel.setUserPreferences = function(username, push_mode, group_mode, max_show_notifications, callback)
{
  mongoose.connection.db.collection('USER', function (err, collection) {
      collection.find({'username': username}).toArray(function(err, docs) {
          if (docs[0]!=undefined) {
            docs[0].push_enabled = parseInt(push_mode);
            docs[0].group_notifications = parseInt(group_mode);
            if (max_show_notifications!=undefined) {
              docs[0].max_show_notifications = parseInt(max_show_notifications);
            }
            collection.save(docs[0]);
            callback(null, docs);
          } else {
            callback(null, []);
          }
      });
  });
}

userModel.getConfigUser = function(username, callback)
{
    mongoose.connection.db.collection('USER', function (err, collection) {
        collection.find({'username': username}).toArray(function(err, docs) {
            if (docs[0]!=undefined) {
                callback(null, {push_enabled: docs[0].push_enabled, max_show_notifications: docs[0].max_show_notifications});
            } else {
                callback(null, -1);
            }
        });
    });
}


userModel.getUserFromUsername = function(username, callback)
{
  mongoose.connection.db.collection('USER', function (err, collection) {
      collection.find({'username': username}).toArray(function(err, docs) {
          callback(null, docs);
      });
  });
}

userModel.saveDeviceInfo = function(username, token, device_model,
  device_platform, device_version, device_manufacturer,device_serial, device_uuid,
  device_height, device_width, device_language, app_version,  callback)
{
    mongoose.connection.db.collection('USER', function (err, collection) {
        collection.find({'username': username}).toArray(function(err, docs) {
            if (docs[0]!=undefined) {
                docs[0].token = token;
                device_info = {
                  'device_model': device_model,
                  'device_platform': device_platform,
                  'device_version': device_version,
                  'device_manufacturer': device_manufacturer,
                  'device_serial': device_serial,
                  'device_uuid': device_uuid,
                  'device_height': device_height,
                  'device_width': device_width,
                  'device_language': device_language,
                  'app_version': app_version,
                  'last_login': new Date().toISOString()
                }
                docs[0].device_info = device_info;

                collection.save(docs[0]);
                callback(null, docs);
            } else {
                callback(null, []);
            }
        });
    });
}

userModel.getUserFromUsername_Mysql = function(username,callback)
{
  pool.getConnection(function(err, connection) {
    if (connection)
    {
        var sql = "SELECT USERNAME as username, PASSWORD as password, IFNULL(API_PERMISSIONS, '') as permissions from USER_GUI WHERE USERNAME = " + connection.escape(username);
        log.debug ("Query:" + sql);
        connection.query(sql, function(error, row)
        {
            connection.release();
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
      //throw error;
    }
  });
}

//obtenemos un usuario por su username
userModel.getUserFromUsername = function(username,callback)
{
  mongoose.connection.db.collection('USER', function (err, collection) {
    collection.find( { 'username': username}).toArray(function(err, docs) {
        callback(null, docs);
    });
  });  
}


// Obtener todos los usuarios
userModel.getUsers = function(startRow, endRow, sortBy, callback)
{
  pool.getConnection(function(err, connection) {
    if (connection)
    {
      var sqlCount = 'SELECT count(*) as nrows FROM USER_GUI';
      log.debug ("Query: "+sqlCount);
      connection.query(sqlCount, function(err, row)
      {
        if(row)
        {
          var consulta = "SELECT USER_GUI.ID as id, USERNAME as username, PASSWORD as pasword, PACKAGES.DESCRIPTION as role from USER_FUNCTIONALITY inner join USER_GUI on USER_GUI.USERNAME=USER_FUNCTIONALITY.USER_NAME inner join PACKAGES on PACKAGES.ID=USER_FUNCTIONALITY.PACKAGES_ID group by username";

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
                if (element == 'id' || element == 'username')
                {
                  if (orderBy == '')
                    orderBy = element + ' desc';
                  else
                    orderBy = orderBy + ',' + element + ' desc';
                }
              } else {
                var element = vsortBy[i];
                if (element == 'id' || element == 'username')
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
              connection.release();
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
  });
}

//obtenemos un usuario por su id
userModel.getUser = function(id,callback)
{
  pool.getConnection(function(err, connection) {
    if (connection)
    {
        //var sql = "SELECT USER_GUI.ID as id, USERNAME as username, PASSWORD as password, PACKAGES.DESCRIPTION as role FROM USER_GUI inner join USER_FUNCTIONALITY on USER_GUI.USERNAME=USER_FUNCTIONALITY.USER_NAME, USER_FUNCTIONALITY uf inner join PACKAGES on uf.PACKAGES_ID=PACKAGES.ID WHERE USER_GUI.ID = " + connection.escape(id) + " group by USER_GUI.ID";
        var sql = "SELECT USER_GUI.ID as id, USERNAME as username, PASSWORD as pasword, PACKAGES.DESCRIPTION as role from USER_FUNCTIONALITY inner join USER_GUI on USER_GUI.USERNAME=USER_FUNCTIONALITY.USER_NAME inner join PACKAGES on PACKAGES.ID=USER_FUNCTIONALITY.PACKAGES_ID WHERE USER_GUI.ID = " + connection.escape(id) + " group by USER_GUI.ID";

        log.debug ("Query: "+sql);
        connection.query(sql, function(error, row)
        {
            connection.release();
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
  });
}

//obtenemos un usuario y sus servicios por su username
userModel.getUserWithServicesFromUsername = function(username,callback)
{
  pool.getConnection(function(err, connection) {
    if (connection)
    {
        // sin consultar funcionalidades
        //var sql = "SELECT USER_GUI.ID as id, USERNAME as username, PASSWORD as password, PACKAGES.DESCRIPTION as role FROM USER_GUI inner join USER_FUNCTIONALITY on USER_GUI.USERNAME=USER_FUNCTIONALITY.USER_NAME, USER_FUNCTIONALITY uf inner join PACKAGES on uf.PACKAGES_ID=PACKAGES.ID WHERE USER_GUI.USERNAME = " + connection.escape(username) + " group by USER_GUI.USERNAME";

        //con funcionalidades
        //var sql = "SELECT USER_GUI.ID as id, USERNAME as username, PASSWORD as password, PACKAGES.DESCRIPTION as role, GROUP_CONCAT(distinct f2.SUMO_ENUM) as serviceList FROM USER_GUI inner join USER_FUNCTIONALITY on USER_GUI.USERNAME=USER_FUNCTIONALITY.USER_NAME, USER_FUNCTIONALITY uf inner join PACKAGES on uf.PACKAGES_ID=PACKAGES.ID, USER_FUNCTIONALITY uf2 right join FUNCTIONALITY f2 on uf2.FUNCTIONALITY_ID=f2.ID WHERE USER_GUI.USERNAME = " + connection.escape(username) + " and uf2.USER_NAME= " + connection.escape(username) + " group by USER_GUI.USERNAME";
        var sql = "SELECT USER_GUI.ID AS id, USERNAME AS username, PASSWORD AS password, PACKAGES.DESCRIPTION AS ROLE, GROUP_CONCAT(DISTINCT FUNCTIONALITY.SUMO_ENUM) AS serviceList FROM USER_FUNCTIONALITY INNER JOIN USER_GUI ON USER_FUNCTIONALITY.USER_NAME=USER_GUI.USERNAME INNER JOIN PACKAGES ON USER_FUNCTIONALITY.PACKAGES_ID=PACKAGES.ID RIGHT JOIN FUNCTIONALITY ON USER_FUNCTIONALITY.FUNCTIONALITY_ID=FUNCTIONALITY.ID WHERE USER_GUI.USERNAME =" + connection.escape(username) + " GROUP BY USER_GUI.USERNAME";
        log.debug ("Query:" + sql);
        connection.query(sql, function(error, row)
        {
            connection.release();
            if(error)
            {
                callback(error, null);
                //throw error;
            }
            else
            {
                callback(null, row);
            }
        });
    }
    else {
      callback(null, null);
      //throw error;
    }
  });
}





//exportamos el objeto para tenerlo disponible en la zona de rutas
module.exports = userModel;
