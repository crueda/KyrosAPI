var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var Client = require('node-rest-client').Client;
//var selfSignedHttps = require('self-signed-https')
var schedule = require('node-schedule');
var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('./api.properties');

var login = require('./routes/login');
var validate = require('./routes/validate');

var kyrosapiService = require('./routes/kyrosapiService');

var areas = require('./routes/areas');
var vertex = require('./routes/vertex');
var driver = require('./routes/driver');
var vehicle = require('./routes/vehicle');
var route = require('./routes/route');
var beacon = require('./routes/beacon');
var poi = require('./routes/poi');
var tracking = require('./routes/tracking');

//var port = require('./routes/port');

// usuarios
var user = require('./routes/user.js');

var layer = require('./routes/layer.js');

//necesario para utilizar los verbos put y delete en formularios
var methodOverride = require('method-override');

var app = express();

//configuración para ejs
app.set('views', path.join(__dirname, 'views'));
app.engine("html", require("ejs").renderFile);
app.set('view engine', 'html');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
//app.use(session({secret: 'ssshhhhh',saveUninitialized: true,resave: true}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

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
  res.header('Access-Control-Allow-Headers', 'Content-type,Accept,X-Access-Token,X-Key');
  if (req.method == 'OPTIONS') {
    res.status(200).end();
  } else {
    next();
  }
});

app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'apidoc')));

// Zona desmilitarizada
app.use('/', login);
app.use('/', validate);



// AUTENTICACION TOKEN
//app.all('/*', [require('./middlewares/validateRequest')]);


app.use('/kyrosapi', kyrosapiService);
app.use('/kyrosapi', areas);
app.use('/kyrosapi', vertex);
app.use('/kyrosapi', driver);
app.use('/kyrosapi', vehicle);
app.use('/kyrosapi', route);
app.use('/kyrosapi', beacon);
app.use('/kyrosapi', poi);
app.use('/kyrosapi', user);
app.use('/kyrosapi', layer);
app.use('/kyrosapi', tracking);


// If no route is matched by now, it must be a 404
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  res.status(404).json({"message":"Not Found"})
  //next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500).json({"message":err.message || "Internal error"})
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500).json({"message":err.message || "Internal error"})
});



module.exports = app;
