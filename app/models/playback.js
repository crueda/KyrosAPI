var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('kyrosapi.properties');

var mongoose = require('mongoose');
var moment = require("moment");

// Definición del log
var fs = require('fs');
var log = require('tracer').console({
  transtracking: function (data) {
    //console.log(data.output);
    fs.open(properties.get('main.log.file'), 'a', 0666, function (e, id) {
      fs.write(id, data.output + "\n", null, 'utf8', function () {
        fs.close(id, function () {
        });
      });
    });
  }
});

var dbMongoName = properties.get('bbdd.mongo.name');
var dbMongoHost = properties.get('bbdd.mongo.ip');
var dbMongoPort = properties.get('bbdd.mongo.port');

//mongoose.createConnection('mongodb://' + dbMongoHost + ':' + dbMongoPort + '/' + dbMongoName,  { server: { reconnectTries: 3, poolSize: 5 } }, function (error) {
mongoose.connect('mongodb://' + dbMongoHost + ':' + dbMongoPort + '/' + dbMongoName, { server: { reconnectTries: 3, poolSize: 5 } }, function (error) {
  if (error) {
    log.info(error);
  }
});

var playbackModel = {};

playbackModel.getKmlFromToken = function (token, callback) {
  function padToTwo(number) {
    if (number <= 9) { number = ("0" + number).slice(-4); }
    return number;
  }
  mongoose.connection.db.collection('PLAYBACK', function (err, collection) {
    collection.find({ "token": token }).toArray(function (err, docs) { 
      if (docs!=undefined && docs[0]!=undefined) {
        mongoose.connection.db.collection('TRACKING', function (err, collection) {
            collection.find({ 'device_id': parseInt(docs[0].device_id), 'pos_date': { $gt: parseInt(docs[0].init_date), $lt: parseInt(docs[0].end_date) } }).sort({ 'pos_date': 1 }).limit(7000).toArray(function (err, docsTracking) {

            if (docsTracking!=undefined && docsTracking.length>1) {
              var kml_init_date =  moment(docsTracking[0].pos_date).format("YYYY-MM-DDTHH:mm:ss.SSS");

              var dateDuration = new Date(docsTracking[docsTracking.length-1].pos_date - docsTracking[0].pos_date);
              var dateDurationUTC = new Date(dateDuration.getUTCFullYear(), dateDuration.getUTCMonth(), dateDuration.getUTCDate(), dateDuration.getUTCHours(), dateDuration.getUTCMinutes(), dateDuration.getUTCSeconds());
              var h = dateDurationUTC.getHours();
              var m = dateDurationUTC.getMinutes();
              var s = dateDurationUTC.getSeconds();
              totalIsoDate = padToTwo(h) + ":" + padToTwo(m) + ":" + padToTwo(s);

              var initIsoDate = "";
              var endIsoDate = "";
              if (docs[0].time_zone!=undefined) {
                initIsoDate = moment.tz(new Date(docsTracking[0].pos_date), docs[0].time_zone).format("DD/MM/YYYY HH:mm:ss");
                endIsoDate = moment.tz(new Date(docsTracking[docsTracking.length-1].pos_date), docs[0].time_zone).format("DD/MM/YYYY HH:mm:ss");                
              } else {
                initIsoDate = moment.tz(new Date(docsTracking[0].pos_date), "Europe/Madrid").format("DD/MM/YYYY HH:mm:ss");
                endIsoDate = moment.tz(new Date(docsTracking[docsTracking.length-1].pos_date), "Europe/Madrid").format("DD/MM/YYYY HH:mm:ss");                
              }
              
              var lon_init = docsTracking[0].location.coordinates[0];
              var lat_init = docsTracking[0].location.coordinates[1];
              var altitude_init = docsTracking[0].altitude;

              var lon_end = docsTracking[docsTracking.length-1].location.coordinates[0];
              var lat_end = docsTracking[docsTracking.length-1].location.coordinates[1];
              var altitude_end = docsTracking[docsTracking.length-1].altitude;

              var distance = 0;
              var min_speed = 9999;
              var max_speed = 0;
              var sum_speed = 0;
              var min_altitude = 999999;
              var max_altitude = 0;
              var sum_altitude = 0;

              var kml_data = "";
              for (var i=0; i<docsTracking.length;i++) {
                if (i>0) {
                  distance += docsTracking[i].distance;
                }
                if (docsTracking[i].speed > max_speed) {
                  max_speed = docsTracking[i].speed;
                }
                if (docsTracking[i].speed < min_speed) {
                  min_speed = docsTracking[i].speed;
                }
                sum_speed += docsTracking[i].speed;
                if (docsTracking[i].altitude > max_altitude) {
                  max_altitude = docsTracking[i].altitude;
                }
                if (docsTracking[i].altitude < min_altitude) {
                  min_altitude = docsTracking[i].altitude;
                }
                sum_altitude += docsTracking[i].altitude;

                var kml_date =  moment(docsTracking[i].pos_date).format("YYYY-MM-DDTHH:mm:ss.SSS");
                var lon = docsTracking[i].location.coordinates[0];
                var lat = docsTracking[i].location.coordinates[1];
                var altitude = docsTracking[i].altitude;
                kml_data = kml_data + `
                <when>`;
                kml_data = kml_data + kml_date + `Z</when>`;
                kml_data = kml_data + `
                <gx:coord>` + lon + ` ` + lat + ` ` + altitude + `</gx:coord>`;
              }              

var kml_init = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2"
xmlns:gx="http://www.google.com/kml/ext/2.2"
xmlns:atom="http://www.w3.org/2005/Atom">
<Document>
<open>1</open>
<visibility>1</visibility>
<name><![CDATA[Playback]]></name>
<Style id="track">
<LineStyle><color>7f0000ff</color><width>4</width></LineStyle>
<IconStyle>
<scale>1.3</scale>
<Icon><href>http://192.168.28.244:8080/Apps/kyros/images/car.png</href></Icon>
</IconStyle>
</Style>
<Style id="start"><IconStyle>
<scale>1.3</scale>
<Icon><href>http://maps.google.com/mapfiles/kml/paddle/grn-circle.png</href></Icon>
<hotSpot x="32" y="1" xunits="pixels" yunits="pixels"/>
</IconStyle></Style>
<Style id="end"><IconStyle>
<scale>1.3</scale>
<Icon><href>http://maps.google.com/mapfiles/kml/paddle/red-circle.png</href></Icon>
<hotSpot x="32" y="1" xunits="pixels" yunits="pixels"/>
</IconStyle></Style>
<Style id="statistics"><IconStyle>
<scale>1.3</scale>
<Icon><href>http://maps.google.com/mapfiles/kml/pushpin/ylw-pushpin.png</href></Icon>
<hotSpot x="20" y="2" xunits="pixels" yunits="pixels"/>
</IconStyle></Style>
<Style id="waypoint"><IconStyle>
<scale>1.3</scale>
<Icon><href>http://maps.google.com/mapfiles/kml/pushpin/blue-pushpin.png</href></Icon>
<hotSpot x="20" y="2" xunits="pixels" yunits="pixels"/>
</IconStyle></Style>
<Schema id="schema">
</Schema>
<Placemark>
<name>Inicio</name>
<description><![CDATA[]]></description>
<TimeStamp><when>` + kml_init_date + `Z</when></TimeStamp>
<styleUrl>#start</styleUrl>
<Point>
<coordinates>` + lon_init + ` ` + lat_init + ` ` + altitude_init + `</coordinates>
</Point>
</Placemark>
<Placemark id="tour">
<name><![CDATA[` + docs[0].vehicle_license + `]]></name>
<description><![CDATA[
Fecha inicial:    ` + initIsoDate + `<br>
Fecha final:      ` + endIsoDate + `<br>
Tiempo:           ` + totalIsoDate + `<br>
Distancia:        ` + distance.toFixed(3) + ` Km<br>`
if (min_speed>0) {
  kml_init = kml_init + `Velocidad mínima: ` + min_speed.toFixed(2) + ` Km/h<br>`
}
kml_init = kml_init + `
Velocidad máxima: ` + max_speed.toFixed(2) + ` Km/h<br>
Velocidad media:  ` + (distance/(dateDuration/3600000)).toFixed(2) + ` Km/h<br>`
if (min_altitude.toFixed(0)>0) {
  kml_init = kml_init + `Altitud mínima:   ` + min_altitude.toFixed(0) + ` m<br>
  Altitud máxima:   ` + max_altitude.toFixed(0) + ` m<br>
  Altitud media:    ` + (sum_altitude/docsTracking.length).toFixed(0) + ` m<br>`
}
kml_init = kml_init + `]]></description>  
<styleUrl>#track</styleUrl>
<ExtendedData>
<Data name="type"><value><![CDATA[biking]]></value></Data>
</ExtendedData>
<gx:MultiTrack>
<altitudeMode>absolute</altitudeMode>
<gx:interpolate>1</gx:interpolate>
<gx:Track>`;

var kml_end = `
<ExtendedData>
<SchemaData schemaUrl="#schema">
</SchemaData>
</ExtendedData>
</gx:Track>
</gx:MultiTrack>
</Placemark>
<Placemark>
<name>Fin</name>
<TimeStamp><when>` + kml_init_date + `Z</when></TimeStamp>
<styleUrl>#end</styleUrl>
<Point>
<coordinates>` + lon_end + ` ` + lat_end + ` ` + altitude_end + `</coordinates>
</Point>
</Placemark>
</Document>           
</kml>`;
            
              callback(null, kml_init + kml_data + kml_end);
            } else {
              callback(null, ""); 
            }
          });
        });
       } else {
        callback(null, "");      
      }              
    });
  });
}

//extrackingamos el objeto para tenerlo disponible en la zona de rutas
module.exports = playbackModel;
