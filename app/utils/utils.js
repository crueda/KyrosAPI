var utils = {};

var jwt = require('jwt-simple');

// Obtener todos las fleets
utils.getUsernameFromToken = function(req) {
  var token = req.headers['x-access-token'] || req.headers['x-access'];
  var decoded = jwt.decode(token, require('../config/secret.js')());
  var username = decoded.iss;
    if (username == '') {
        username = decoded.jti;
    }
  return username;
}

module.exports = utils;