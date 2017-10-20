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
  mongoose.connection.db.collection('PLAYBACK', function (err, collection) {
    collection.find({ "token": token }).toArray(function (err, docs) { 
      if (docs!=undefined && docs[0]!=undefined) {
        mongoose.connection.db.collection('TRACKING', function (err, collection) {
          //var initEpoch = moment(initDate, 'YYYY-MM-DDTHH:mm:ssZ');
          //var endEpoch = moment(endDate, 'YYYY-MM-DDTHH:mm:ssZ');
            collection.find({ 'device_id': docs[0].device_id, 'pos_date': { $gt: parseInt(docs[0].init_date), $lt: parseInt(docs[0].end_date) } }).sort({ 'pos_date': 1 }).limit(7000).toArray(function (err, docsTracking) {

            var kml_init_date =  moment(docsTracking[0].pos_date).format("YYYY-MM-DDTHH:mm:ss.SSS");
              
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
<gx:SimpleArrayField name="power" type="int">
<displayName><![CDATA[Power (W)]]></displayName>
</gx:SimpleArrayField>
<gx:SimpleArrayField name="cadence" type="int">
<displayName><![CDATA[Cadence (rpm)]]></displayName>
</gx:SimpleArrayField>
<gx:SimpleArrayField name="heart_rate" type="int">
<displayName><![CDATA[Heart rate (bpm)]]></displayName>
</gx:SimpleArrayField>
</Schema>
<Placemark>
<name><![CDATA[Schuylkill River Trail Bike Ride (Start)]]></name>
<description><![CDATA[]]></description>
<TimeStamp><when>` + kml_init_date + `Z</when></TimeStamp>
<styleUrl>#start</styleUrl>
<Point>
<coordinates>-75.300238,40.109584,-2.799999952316284</coordinates>
</Point>
</Placemark>
<Placemark id="tour">
<name><![CDATA[` + docs[0].vehicle_license + `]]></name>
<description><![CDATA[
Name: Playback<br>
Total distance: 26.30 km (16.3 mi)<br>
Total time: 1:33:41<br>
Moving time: 1:32:26<br>
Average speed: 16.84 km/h (10.5 mi/h)<br>
Average moving speed: 17.07 km/h (10.6 mi/h)<br>
Max speed: 36.90 km/h (22.9 mi/h)<br>
]]></description>
<styleUrl>#track</styleUrl>
<ExtendedData>
<Data name="type"><value><![CDATA[biking]]></value></Data>
</ExtendedData>
<gx:MultiTrack>
<altitudeMode>absolute</altitudeMode>
<gx:interpolate>1</gx:interpolate>
<gx:Track>`;

var kml_data = "";
for (var i=0; i<docsTracking.length;i++) {
  var kml_date =  moment(docsTracking[i].pos_date).format("YYYY-MM-DDTHH:mm:ss.SSS");
  var lon = docsTracking[i].location.coordinates[0];
  var lat = docsTracking[i].location.coordinates[1];
  kml_data = kml_data + `
  <when>`;
  kml_data = kml_data + kml_date + `Z</when>`;
  kml_data = kml_data + `
  <gx:coord>` + lon + ` ` + lat + ` 0` + `</gx:coord>`;
}              

var kml_old = `
<when>2013-07-25T19:33:59.000Z</when>
<gx:coord>-75.300234 40.109597 38.0</gx:coord>
<when>2013-07-25T19:34:00.000Z</when>
<gx:coord>-75.300214 40.109641 36.099998474121094</gx:coord>
<when>2013-07-25T19:34:09.000Z</when>
<gx:coord>-75.300233 40.109603 20.700000762939453</gx:coord>
<when>2013-07-25T19:34:10.000Z</when>
<gx:coord>-75.30025 40.109586 25.600000381469727</gx:coord>
<when>2013-07-25T19:34:42.000Z</when>
<gx:coord>-75.30026 40.10963 36.5</gx:coord>
<when>2013-07-25T19:34:43.000Z</when>
<gx:coord>-75.300061 40.10971 33.400001525878906</gx:coord>
<when>2013-07-25T21:07:25.000Z</when>
<gx:coord>-75.30001 40.109709 33.29999923706055</gx:coord>`;

var kml_end = `
<ExtendedData>
<SchemaData schemaUrl="#schema">
</SchemaData>
</ExtendedData>
</gx:Track>
</gx:MultiTrack>
</Placemark>
<Placemark>
<name><![CDATA[Schuylkill River Trail Bike Ride (End)]]></name>
<TimeStamp><when>` + kml_init_date + `Z</when></TimeStamp>
<styleUrl>#end</styleUrl>
<Point>
<coordinates>-75.30001,40.109709,33.29999923706055</coordinates>
</Point>
</Placemark>
</Document>           
</kml>`;
            
              callback(null, kml_init + kml_data + kml_end);
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
