var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('kyrosapi.properties');

var jwt = require('jwt-simple');
var VehicleModel = require('../models/vehicle');
var UserModel = require('../models/user');
var status = require("../utils/statusCodes.js");
var messages = require("../utils/statusMessages.js");

// Definición del log
var fs = require('fs');
var log = require('tracer').console({
    transport: function (data) {
        //console.log(data.output);
        fs.open(properties.get('main.log.file'), 'a', 0666, function (e, id) {
            fs.write(id, data.output + "\n", null, 'utf8', function () {
                fs.close(id, function () {
                });
            });
        });
    }
});

function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

module.exports = function (req, res, next) {
    var token = req.headers['x-access-token'] || req.headers['x-access'];

    if (token) {
        try {
            if (token == '') {
                log.debug('Invalid token');
                res.status(202).json({ "response": { "status": status.STATUS_FAILURE, "description": messages.TOKEN_INCORRECT } })
                return;
            }

            var decoded = jwt.decode(token, require('../config/secret.js')());

            // Comprobar la expiracion del token
            var now = new Date;
            var timezone =  now.getTimezoneOffset()
            var milisecondsUTC = now.getTime() + (timezone*60*1000);
            if (decoded.exp <= milisecondsUTC) {
                log.info('Token Expired');
                res.status(202).json({"response": {"status":status.STATUS_LOGIN_INCORRECT,"description":messages.TOKEN_EXPIRED}})
                return;
            }

            var username = decoded.iss;
            if (username == '') {
                username = decoded.jti;
            }

            var myJson = req.body;
            if (myJson == undefined) {
                res.status(202).json({ "response": { "status": status.STATUS_VALIDATION_ERROR, "description": messages.MISSING_PARAMETER } });
            }
            else {
                try {
                    var vehicleIds = "";
                    if (myJson.vehicles != undefined) {
                        vehicleIds = myJson.vehicles.toString();

                        var aVehicleIds = new Array();
                        aVehicleIds = vehicleIds.split(",");

                        UserModel.getUserFromUsername(username, function (error, userData) {
                        if (userData[0].kind_monitor==2) {
                            next();
                        } else {

                            VehicleModel.getVehiclesFromUsername(username, function (error, data) {
                                var notAllow = false;
                                var notAllow_element = 0;
                                for (var i = 0; i < aVehicleIds.length; i++) {
                                    if (data.indexOf(parseInt(aVehicleIds[i])) == -1) {
                                        notAllow = true;
                                        notAllow_element = aVehicleIds[i];
                                    }
                                }
                                if (!notAllow) {
                                    next();
                                }
                                else {
                                    log.debug('Not allow');
                                    res.status(202).json({ "response": { "status": status.STATUS_VALIDATION_ERROR, "description": messages.NOT_ALLOW + ". Vehicle: " + notAllow_element } })
                                }
                            });
                        }
                        });
                    }
                    else {
                        res.status(202).json({ "response": { "status": status.STATUS_VALIDATION_ERROR, "description": messages.MISSING_PARAMETER } });
                    }

                } catch (err) {
                    res.status(202).json({ "response": { "status": status.STATUS_VALIDATION_ERROR, "description": messages.MISSING_PARAMETER } });
                }
            }

        } catch (err) {
            log.error("ERROR: " + err);
            res.status(202).json({ "response": { "status": status.STATUS_FAILURE, "description": messages.MISSING_PARAMETER } })
        }
    } else {
        res.status(202).json({ "response": { "status": status.STATUS_FAILURE, "description": messages.TOKEN_INCORRECT } })
        return;
    }
}
