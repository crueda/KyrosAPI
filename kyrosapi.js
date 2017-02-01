var http = require('http');
var express = require('express');
var path = require('path');
var session = require('express-session');
var bodyParser = require('body-parser');
var errorHandler = require('errorhandler');
var cookieParser = require('cookie-parser');
var MongoDBStore = require('connect-mongodb-session')(session);

var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('./kyrosapi.properties');

var api_tracking = require('./app/routes/tracking');
var api_odometer = require('./app/routes/odometer');
var api_activity = require('./app/routes/activity');
var api_poi = require('./app/routes/poi');
var api_monitor = require('./app/routes/monitor');
var api_numpositions = require('./app/routes/numpositions');
var api_image = require('./app/routes/image');
var api_heatmap = require('./app/routes/heatmap');
var api_vehicle = require('./app/routes/vehicle');
var api_share = require('./app/routes/share');
var api_watch = require('./app/routes/watch');
var api_login = require('./app/routes/login');
var api_push = require('./app/routes/push');
var api_icon = require('./app/routes/icon');

var api_app_notification = require('./app/routes/app_notification');
var api_app_tracking = require('./app/routes/app_tracking');
var api_app_user = require('./app/routes/app_user');
var api_app_vehicle = require('./app/routes/app_vehicle');
var api_app_monitor = require('./app/routes/app_monitor');
var api_app_graph = require('./app/routes/app_graph');

var i18n = require("i18n");

//necesario para utilizar los verbos put y delete en formularios
var methodOverride = require('method-override');

var app = express();

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

app.locals.pretty = true;
app.set('port', process.env.PORT || 3000);
app.use(cookieParser());
app.use(require('stylus').middleware({ src: __dirname + '/app/public' }));
app.use(express.static(__dirname + '/app/public'));

//configuramos methodOverride
app.use(methodOverride(function(req, res){
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    // look in urlencoded POST bodies and delete it
    var method = req.body._method
    delete req.body._method
    return method
  }
}));

app.all('/*', function(req, res, next) {
  // CORS headers
  res.header("Access-Control-Allow-Origin", "*"); // restrict it to the required domain
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  // Set custom headers for CORS
  res.header('Access-Control-Allow-Headers', 'Content-type,Accept,X-Access-Token,X-Access,X-Key');
  if (req.method == 'OPTIONS') {
    res.status(200).end();
  } else {
    next();
  }
});

app.use('/api', api_login);
app.use('/api', api_push);
app.use('/api', api_tracking);
app.use('/api', api_odometer);
app.use('/api', api_activity);
app.use('/api', api_poi);
app.use('/api', api_monitor);
app.use('/api', api_numpositions);
app.use('/api', api_image);
app.use('/api', api_heatmap);
app.use('/api', api_vehicle);
app.use('/api', api_share);
app.use('/api', api_watch);
app.use('/api', api_icon);

// AUTENTICACION TOKEN
//app.all('/*', [require('./app/middlewares/validateRequest')]);
//app.all('/api/app/*', [require('./app/middlewares/validateRequest')]);
app.use('/api', api_app_notification);
app.use('/api', api_app_user);
app.use('/api', api_app_tracking);
app.use('/api', api_app_vehicle);
app.use('/api', api_app_monitor);
app.use('/api', api_app_graph);


// If no route is matched by now, it must be a 404
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  res.status(404).json({"message":"Not Found"})
  //next(err);
});

http.createServer(app).listen(app.get('port'), function(){
	console.log('KyrosAPI server listening on port ' + app.get('port'));
});

module.exports = app;
