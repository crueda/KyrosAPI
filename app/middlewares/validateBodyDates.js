var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('kyrosapi.properties');

var jwt = require('jwt-simple');
var moment = require('moment');
var VehicleModel = require('../models/vehicle');
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
    try {
        var myJson = req.body;
        if (myJson == undefined) {
            res.status(202).json({ "response": { "status": status.STATUS_VALIDATION_ERROR, "description": messages.MISSING_PARAMETER } });
        }
        else {
            try {
                if (myJson.initDate != undefined && myJson.endDate != undefined) {

                    if (!moment(myJson.initDate, 'YYYY-MM-DDTHH:mm:ssZ', true).isValid() || !moment(myJson.endDate, 'YYYY-MM-DDTHH:mm:ssZ', true).isValid()) {
                        res.status(202).json({ "response": { "status": status.STATUS_VALIDATION_ERROR, "description": messages.DATE_INCORRECT } })
                    } else {
                        next();
                    }
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

}
