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

// Crear un objeto para ir almacenando todo lo necesario
var personnelModel = {};

// Obtener todos las personnel
personnelModel.getPersonels = function(startRow, endRow, sortBy, callback)
{  if (connection)
  {
    var sqlCount = 'SELECT count(*) as nrows FROM DRIVER';
    log.debug ("Query: "+sqlCount);
    connection.query(sqlCount, function(err, row)
    {
      if(row)
      {
        var consulta = "select DRIVER.DRIVER_ID as id, DATE_FORMAT(FROM_UNIXTIME(FLOOR(DRIVER.CREATION_TIME/1000)), '%Y-%m-%dT%TZ') as creationTime, GROUP_CONCAT(CERTIFICATION.CERTIFICATE_ID)as certificateList,GROUP_CONCAT(DATE_FORMAT(FROM_UNIXTIME(FLOOR(CERTIFICATION.LIMIT_DATE/1000)), '%Y-%m-%dT%TZ')) as certificateExpirationList, DRIVER.DRIVER_LICENSE as license, DRIVER.FIRST_NAME as firstName, DRIVER.LAST_NAME as lastName, DRIVER.COMPANY as company, DRIVER.ROLE as role, DRIVER.ACCESS as access, DRIVER.WORKING_TIME as workingTime, DRIVER.CONTACT_TELEPHONE as phone, DRIVER.EMAIL as email, DRIVER.NOK as nok from DRIVER left join CERTIFICATION on DRIVER.DRIVER_ID=CERTIFICATION.DRIVER_ID GROUP BY DRIVER.DRIVER_ID"
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
              if (element == 'id' || element == 'creationTime' || element == 'firstName' || element == 'lastName' || element == 'license' || element == 'company' || element == 'role' || element == 'access' || element == 'workingTime' || element == 'email' || element == 'nok')
              {
                if (orderBy == '')
                  orderBy = element + ' desc';
                else
                  orderBy = orderBy + ',' + element + ' desc';
              }
            } else {
              var element = vsortBy[i];
              if (element == 'id' || element == 'creationTime' || element == 'firstName' || element == 'lastName' || element == 'license' || element == 'company' || element == 'role' || element == 'access' || element == 'workingTime' || element == 'email' || element == 'nok')
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

// Obtener un personnel por su id
personnelModel.getPersonnel = function(id,callback)
{
    if (connection) {
        var sql = "select DRIVER.DRIVER_ID as id, DATE_FORMAT(FROM_UNIXTIME(FLOOR(DRIVER.CREATION_TIME/1000)), '%Y-%m-%dT%TZ') as creationTime, DRIVER.DRIVER_LICENSE as license, GROUP_CONCAT(CERTIFICATION.CERTIFICATE_ID)as certificateList, GROUP_CONCAT(DATE_FORMAT(FROM_UNIXTIME(FLOOR(CERTIFICATION.LIMIT_DATE/1000)), '%Y-%m-%dT%TZ')) as certificateExpirationList, DRIVER.FIRST_NAME as firstName, DRIVER.LAST_NAME as lastName, DRIVER.COMPANY as company, DRIVER.ROLE as role, DRIVER.ACCESS as access, DRIVER.WORKING_TIME as workingTime, DRIVER.CONTACT_TELEPHONE as phone, DRIVER.EMAIL as email, DRIVER.NOK as nok from CERTIFICATION right join DRIVER on DRIVER.DRIVER_ID=CERTIFICATION.DRIVER_ID WHERE DRIVER.DRIVER_ID = "  + connection.escape(id) + " GROUP BY id";
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

// Actualizar un personnel
personnelModel.updatePersonnel = function(personnelData, callback)
{
    if(connection)
    {
        var v_certificateList = [];
        var v_certificateExpirationList = [];

        if (personnelData.certificateList != null)
        {
          var certificateList = connection.escape(personnelData.certificateList);
          certificateList = certificateList.replace ("'","");
          certificateList = certificateList.replace ("'","");
          v_certificateList = certificateList.split(',');
        }

        if (personnelData.certificateExpirationList != null)
        {
          var certificateExpirationList = connection.escape(personnelData.certificateExpirationList);
          certificateExpirationList = certificateExpirationList.replace ("'","");
          certificateExpirationList = certificateExpirationList.replace ("'","");
          v_certificateExpirationList = certificateExpirationList.split(',');
        }

        if (v_certificateList.length != v_certificateExpirationList.length) {
          callback(null,{"message":"bad_request"});
        }
        else {

          var lock = 2;
          var finish = function() {
              callback(null,{"message":"success"});
          }

        var sql = 'UPDATE DRIVER SET FIRST_NAME = ' + connection.escape(personnelData.firstName) + ',' +
        //'DRIVER_LICENSE = ' + connection.escape(personnelData.license) + ',' +
        'LAST_NAME = ' + connection.escape(personnelData.lastName) + ',' +
        'COMPANY = ' + connection.escape(personnelData.company) + ',' +
        'ROLE = ' + connection.escape(personnelData.role) + ',' +
        'ACCESS = ' + connection.escape(personnelData.access) + ',' +
        'WORKING_TIME = ' + connection.escape(personnelData.workingTime) + ',' +
        'CONTACT_TELEPHONE = ' + connection.escape(personnelData.phone) + ',' +
        'EMAIL = ' + connection.escape(personnelData.email) + ',' +
        'NOK = ' + connection.escape(personnelData.nok) + ' ' +
        'WHERE DRIVER_ID = ' + connection.escape(personnelData.id);

        log.debug ("Query: "+sql);

        connection.query(sql, function(error, result)
        {
            if(error)
            {
               callback(error, null);
            }
            else
            {
                // Borrar las certificaciones e insertarlos de nuevo
                var sqlDeleteCertification = 'DELETE FROM CERTIFICATION WHERE DRIVER_ID = ' + connection.escape(personnelData.id);
                log.debug ("Query: "+sqlDeleteCertification);
                connection.query(sqlDeleteCertification, function(error, result)
                {
                  if(error)
                  {
                    callback(error, null);
                  }
                });

                for (i=0;i<v_certificateList.length;i++)
                {
                  var sqlCertification = 'INSERT INTO CERTIFICATION SET CERTIFICATE_ID = ' + v_certificateList[i] + ',' +
                  'DRIVER_ID = ' + connection.escape(personnelData.id) + ',' +
                  'LIMIT_DATE = ' + v_certificateExpirationList[i];
                  log.debug ("Query: "+sqlCertification);
                  connection.query(sqlCertification, function(error, result)
                  {
                    if(error)
                    {
                       callback(error, null);
                    }
                  });
                }

                lock -= 1;
                if (lock === 0) {
                    finish();
                }
            }
        });

        // Insertar el evento
        var now = moment(new Date());
        var date = now.format("YYYY-MM-DDTHH:mm:ssZ");
        var sqlEvent = "INSERT INTO SUMO_EVENT SET EVENT_DATE = '" + date + "'," +
        "EVENT_TYPE = " + properties.get('sumo.event.personnel.updated') + "," +
        "RESOURCE_ID = " + connection.escape(personnelData.id);
        log.debug ("Query: "+sqlEvent);
        connection.query(sqlEvent, function(error, result)
        {
            if(error)
            {
               callback(error, null);
            }
            else
            {
              lock -= 1;
              if (lock === 0) {
                  finish();
              }
          }
      });
    }
  }
    else {
      callback(null, null);
    }
}

//añadir una nuevo personnel
personnelModel.insertPersonnel = function(personnelData,callback)
{
    if (connection)
    {
      var v_certificateList = [];
      var v_certificateExpirationList = [];

      if (personnelData.certificateList != null)
      {
        var certificateList = connection.escape(personnelData.certificateList);
        certificateList = certificateList.replace ("'","");
        certificateList = certificateList.replace ("'","");
        v_certificateList = certificateList.split(',');
      }

      if (personnelData.certificateExpirationList != null)
      {
        var certificateExpirationList = connection.escape(personnelData.certificateExpirationList);
        certificateExpirationList = certificateExpirationList.replace ("'","");
        certificateExpirationList = certificateExpirationList.replace ("'","");
        v_certificateExpirationList = certificateExpirationList.split(',');
      }

        if (v_certificateList.length != v_certificateExpirationList.length) {
          callback(null,{"message":"bad_request"});
        }
        else {

        var now = moment(new Date());

        var sql = "INSERT INTO DRIVER SET FIRST_NAME = " + connection.escape(personnelData.firstName) + "," +
        "DRIVER_LICENSE = " + connection.escape(personnelData.license) + "," +
        "CREATION_TIME = " + now + "," +
        "LAST_NAME = " + connection.escape(personnelData.lastName) + "," +
        "COMPANY = " + connection.escape(personnelData.company) + "," +
        "ROLE = " + connection.escape(personnelData.role) + "," +
        "ACCESS = " + connection.escape(personnelData.access) + "," +
        "WORKING_TIME = " + connection.escape(personnelData.workingTime) + "," +
        "CONTACT_TELEPHONE = " + connection.escape(personnelData.phone) + "," +
        "EMAIL = " + connection.escape(personnelData.email) + "," +
        "KIND_OF_DRIVER = " + "1" + "," +
        "NOK = " + connection.escape(personnelData.nok);

        log.debug ("Query: "+sql);

        connection.query(sql, function(error, result)
        {
            if(error)
            {
               callback(error, null);
            }
            else
            {
                var personnelInsertId = result.insertId;

                // Insertar las certificaciones
                for (i=0;i<v_certificateList.length;i++)
                {
                  var sqlCertification = 'INSERT INTO CERTIFICATION SET CERTIFICATE_ID = ' + v_certificateList[i] + ',' +
                  'DRIVER_ID = ' + personnelInsertId + ',' +
                  'LIMIT_DATE = ' + v_certificateExpirationList[i];

                  connection.query(sqlCertification, function(error, result)
                  {
                    if(error)
                    {
                       callback(error, null);
                    }
                  });
                }

                //devolvemos la última id insertada
                callback(null,{"insertId" : connection.escape(personnelInsertId)});
            }
        });
      }
    }
    else
    {
      callback(null, null);
    }
}

// Eliminar un personnel pasando la id a eliminar
personnelModel.deletePersonnel = function(id, callback)
{
    if(connection)
    {
        var sqlExists = "select DRIVER.DRIVER_ID as id, DATE_FORMAT(FROM_UNIXTIME(FLOOR(DRIVER.CREATION_TIME/1000)), '%Y-%m-%dT%TZ') as creationTime, DRIVER.DRIVER_LICENSE as license, GROUP_CONCAT(CERTIFICATION.CERTIFICATE_ID)as certificateList, GROUP_CONCAT(DATE_FORMAT(FROM_UNIXTIME(FLOOR(CERTIFICATION.LIMIT_DATE/1000)), '%Y-%m-%dT%TZ')) as certificateExpirationList, DRIVER.FIRST_NAME as firstName, DRIVER.LAST_NAME as lastName, DRIVER.COMPANY as company, DRIVER.ROLE as role, DRIVER.ACCESS as access, DRIVER.WORKING_TIME as workingTime, DRIVER.CONTACT_TELEPHONE as phone, DRIVER.EMAIL as email, DRIVER.NOK as nok from CERTIFICATION right join DRIVER on DRIVER.DRIVER_ID=CERTIFICATION.DRIVER_ID WHERE DRIVER.DRIVER_ID = "  + connection.escape(id) + " GROUP BY id";
        log.debug ("Query: "+sqlExists);
        connection.query(sqlExists, function(err, row)
        {
            //si existe la id del personnel a eliminar
            if(row)
            {
                var sql = 'DELETE FROM DRIVER WHERE DRIVER_ID = ' + connection.escape(id);
                connection.query(sql, function(error, result)
                {
                    if(error)
                    {
                      callback(error, null);
                    }
                    else
                    {
                        // Eliminar todas sus certificaciones
                        var sqlCertification = 'DELETE FROM CERTIFICATION WHERE DRIVER_ID = ' + connection.escape(id);
                        connection.query(sqlCertification, function(error, result)
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
module.exports = personnelModel;
