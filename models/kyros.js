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
/*
connection = mysql.createConnection(
    {
      host: properties.get('bbdd.mysql.ip') ,
      user: properties.get('bbdd.mysql.user') ,
      password: properties.get('bbdd.mysql.passwd') ,
      database: properties.get('bbdd.mysql.name')
    }
);
*/

var connection = mysql.createPool(dbConfig);

// Crear un objeto para ir almacenando todo lo necesario
var kyrosModel = {};

// Obtener informacion de vehiculo
kyrosModel.getVehicle = function(vehicleLicense,callback)
{
    log.debug ("kyrosModel.getVehicle: "+vehicleLicense);

    if (connection)
    {
        var sql = 'SELECT v.DEVICE_ID as deviceId, o.IMEI as imei FROM VEHICLE v, OBT o WHERE v.VEHICLE_LICENSE = o.VEHICLE_LICENSE and v.VEHICLE_LICENSE=' + connection.escape(vehicleLicense);

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

//exportamos el objeto para tenerlo disponible en la zona de rutas
module.exports = kyrosModel;
