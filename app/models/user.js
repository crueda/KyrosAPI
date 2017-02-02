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

// Crear un objeto para ir almacenando todo lo necesario
var userModel = {};

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

//obtenemos un usuario por su username
userModel.getUserFromUsername = function(username,callback)
{
  pool.getConnection(function(err, connection) {
    if (connection)
    {
        // mejorada!
        var sql = "SELECT USERNAME as username, PASSWORD as password from USER_GUI WHERE USERNAME = " + connection.escape(username);
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

userModel.getServicesFromUsername = function(username,callback)
{
  pool.getConnection(function(err, connection) {
    if (connection)
    {
        var sql = "SELECT GROUP_CONCAT(FUNCTIONALITY.SUMO_ENUM) as serviceList from USER_FUNCTIONALITY inner join FUNCTIONALITY on USER_FUNCTIONALITY.FUNCTIONALITY_ID=FUNCTIONALITY.ID where USER_FUNCTIONALITY.USER_NAME=" + connection.escape(username);
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
