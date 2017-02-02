var status = require("../utils/statusCodes.js");
var messages = require("../utils/statusMessages.js");
var express = require('express');
var router = express.Router();
var DriverModel = require('../models/driver');
var moment = require("moment");

// Fichero de propiedades
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

/**
* @apiDefine LoginError
*
* @apiError UserNotFound The id of the User was not found
*
* @apiErrorExample Error-Response:
*     https/1.1 202
*     {
*     "response": {
*        "status": -5,
*        "description": "Invalid user or password"
*      }
*     }
*/

/**
* @apiDefine PermissionError
*
* @apiError NotAllow Access not allow to User
*
* @apiErrorExample Error-Response:
*     https/1.1 202
*     {
*     "response": {
*        "status": -4,
*        "description": "User not authorized"
*      }
*     }
*/

/** @apiDefine TokenError
*
* @apiError TokenInvalid The token is invalid
*
* @apiErrorExample Error-Response:
*     https/1.1 202
*     {
*     "response": {
*        "status": -5,
*        "description": "Invalid token"
*      }
*     }
*/

/** @apiDefine TokenExpiredError
*
* @apiError TokenExpired The token is expired
*
* @apiErrorExample Error-Response:
*     https/1.1 202
*     {
*     "response": {
*        "status": -5,
*        "description": "Token expired"
*      }
*     }
*/

/** @apiDefine MissingParameterError
*
* @apiError MissingParameter Missing parameter
*
* @apiErrorExample Error-Response:
*     https/1.1 202
*     {
*     "response": {
*        "status": -4,
*        "description": "Missing parameter"
*      }
*     }
*/

/** @apiDefine MissingRegisterError
*
* @apiError MissingRegister Missing register
*
* @apiErrorExample Error-Response:
*     https/1.1 202
*     {
*     "response": {
*        "status": -1000,
*        "description": "Missing element"
*      }
*     }
*/

/** @apiDefine IdNumericError
*
* @apiError IdNumeric Id numeric error
*
* @apiErrorExample Error-Response:
*     https/1.1 202
*     {
*     "response": {
*        "status": -9,
*        "description": "The id must be numeric"
*      }
*     }
*/

/** @apiDefine TokenHeader
*
* @apiHeader {String} x-access-token JSON Web Token (JWT)
*
* @apiHeaderExample {json} Header-Example:
*     {
*       "x-access-token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE0MzIyMTg2ODc1ODksImlzcyI6InN1bW8iLCJyb2xlIjoiYWRtaW5pc3RyYXRvciJ9._tYZLkBrESt9FwOccyvripIsZR5S0m8PLZmEgIDEFaY"
*     }
*/

/**
 * @api {post} /drivers Request all drivers
 * @apiName GetDrivers
 * @apiGroup Driver
 * @apiVersion 1.0.1
 * @apiDescription List of drivers
 * @apiSampleRequest https://api.kyroslbs.com/drivers
 *
 * @apiParam {Number} [startRow] Number of first element
 * @apiParam {Number} [endRow] Number of last element
 * @apiParam {String} [sortBy] Sort order on elements (comma separated)
 * @apiParam {String="id","firstName","lastName","license"}  [sortBy]     Results sorting by this param. You may indicate various parameters separated by commas. To indicate descending order you can use the - sign before the parameter
 *
 * @apiSuccess {Object[]} driver       List of drivers
 * @apiSuccessExample Success-Response:
 *     https/1.1 200 OK
 *     {
 *       "response":
 *        {
 *          "status": 0,
 *          "startRow" : 0,
 *          "endRow" : 1,
 *          "totalRows" : 2,
 *          "data": {
 *          "record": [
 *          {
 *            "id": 3,
 *            "license": "09121212B",
 *            "creationTime": "2011-11-04T00:00:00Z,
 *            "certificateList": null,
 *            "certificateExpirationList": null,
 *            "firstName": "Miguel",
 *            "lastName": "Campoviejo",
 *            "company": "LBS",
 *            "phone": "+34 660519563",
 *            "email": "mcampoviejo@kyroslbs.com"
 *          },
 *          {
 *            "id": 4,
 *            "license": "09121212B",
 *            "firstName": "Luis",
 *            "lastName": "Velez",
 *            "company": "LBS",
 *            "workingTime": null,
 *            "phone": "+34 660519563",
 *            "email": "mcampoviejo@wikinger.com"
 *          }]
 *         }
 *       }
 *     }
 *
 * @apiUse TokenHeader
 * @apiUse LoginError
 * @apiUse PermissionError
 * @apiUse TokenError
 * @apiUse TokenExpiredError
 */
router.post('/drivers/', function(req, res)
{
    log.info("POST: /drivers");

    var startRow = req.body.startRow || req.params.startRow || req.query.startRow;
    var endRow = req.body.endRow || req.params.endRow || req.query.endRow;
    var sortBy = req.body.sortBy || req.params.sortBy || req.query.sortBy;
    // Limpiar espacios en blanco
    if (sortBy!=null) {
      sortBy = sortBy.replace(/\s/g, "");
    }

    DriverModel.getDrivers(startRow, endRow, sortBy, function(error, data, totalRows)
    {
        //si existen datos, se envia el json
        if (data == null)
        {
          res.status(200).json({"response": {"status":0,"data": {"record": []}}})
        }
        else if (typeof data !== 'undefined')
        {
          if (startRow == null || endRow == null) {
            startRow = 0;
            endRow = totalRows;
          }
          res.status(200).json({"response": {"status":0,"totalRows":totalRows,"startRow":parseInt(startRow),"endRow":parseInt(endRow),"data": {"record": data}}})
        }
        //en otro caso se muestra error
        else
        {
            res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})

        }
    });
});

/* GET. Se obtiene un driver por su id */
/**
 * @api {get} /driver/:id Request driver information
 * @apiName GetDriver Request driver information
 * @apiGroup Driver
 * @apiVersion 1.0.1
 * @apiDescription Driver information
 * @apiSampleRequest https://api.kyroslbs.com/driver
 *
 * @apiParam {Number} id Driver unique ID
 *
 * @apiSuccess {Number} id Driver unique ID
 * @apiSuccess {String} license License of the driver
 * @apiSuccess {String} creationTime Creation time of driver in ISO format
 * @apiSuccess {String} firstName First name of the driver
 * @apiSuccess {String} lastName Last name of the driver
 * @apiSuccess {String} company Company of the driver
 * @apiSuccess {String} email e-mail of the driver
 *
 * @apiSuccessExample Success-Response:
 *     https/1.1 200 OK
 *     {
 *       "response":
 *        {
 *          "status": 0,
 *          "startRow" : 0,
 *          "endRow" : 1,
 *          "totalRows" : 1,
 *          "data": {
 *          "record": [
 *          {
 *            "id": 3,
 *            "license": "09121212B",
 *            "creationTime": "2011-11-04T00:00:00Z,
 *            "firstName": "Miguel",
 *            "lastName": "Campoviejo",
 *            "company": Wikinger,
 *            "phone": "+34 660519563",
 *            "email": "mcampoviejo@wikinger.com"
 *          }]
 *         }
 *       }
 *     }
 *
 * @apiError DriverNotFound The <code>id</code> of the driver was not found
 *
 * @apiUse TokenHeader
 * @apiUse LoginError
 * @apiUse TokenError
 * @apiUse TokenExpiredError
 * @apiUse MissingRegisterError
 * @apiUse IdNumericError
*/
router.get('/driver/:id', function(req, res)
{
    var id = req.params.id;
    log.info("GET: /driver/"+id);

    //se comprueba que la id es un número
    if(!isNaN(id))
    {
      DriverModel.getDriver(id,function(error, data)
      {
          if (data == null)
          {
            res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
          }
          else
          {
            //si existe enviamos el json
            if (typeof data !== 'undefined' && data.length > 0)
            {
                res.status(200).json({"response": {"status":0,"totalRows":1,"startRow":0,"endRow":1,"data": {"record": data}}})
            }
            //en otro caso mostramos un error
            else
            {
              res.status(202).json({"response": {"status":status.STATUS_NOT_FOUND_REGISTER,"description":messages.MISSING_REGISTER}})
            }
          }
      });
    }
    //si la id no es numerica mostramos un error de servidor
    else
    {
      res.status(202).json({"response": {"status":status.STATUS_UPDATE_WITHOUT_PK_ERROR,"description":messages.ID_NUMERIC_ERROR}})
    }
});

/**
 * @api {put} /driver/ Update driver
 * @apiName PutNewDriver
 * @apiGroup Driver
 * @apiVersion 1.0.1
 * @apiDescription Update driver information
 * @apiSampleRequest https://api.kyroslbs.com/driver
 *
 * @apiParam {String} id Driver unique ID
 * @apiParam {String} firstName First name of the driver
 * @apiParam {String} lastName Last name of the driver
 * @apiParam {String} company Company of the driver
 * @apiParam {String} email e-mail of the driver
 *
 * @apiSuccess {json} message Result message
 *
 * @apiSuccessExample Success-Response:
 *     https/1.1 200 OK
 *     {
 *       "response":
 *        {
 *          "status": 0,
 *          "data": {
 *          "record": [
 *          {
 *            "id": 3,
 *            "license": "09121212B",
 *            "creationTime": "2011-11-04T00:00:00Z,
 *            "firstName": "Miguel",
 *            "lastName": "Campoviejo",
 *            "company": Wikinger,
 *            "role": admin,
 *            "access": 1,
 *            "workingTime": null,
 *            "phone": "+34 660519563",
 *             "email": "mcampoviejo@wikinger.com",
 *            "nok": null
 *          }]
 *         }
 *       }
 *     }
 *
 * @apiUse TokenHeader
 * @apiUse LoginError
 * @apiUse TokenError
 * @apiUse TokenExpiredError
 * @apiUse MissingParameterError
 */
router.put('/driver/', function(req, res)
{
    log.info("PUT: /driver");

    var id_value = req.body.id || req.query.id || req.params.id;
    //var license_value = req.body.license || req.query.license || req.params.license;
    var firstName_value = req.body.firstName || req.query.firstName || req.params.firstName;
    var lastName_value = req.body.lastName || req.query.lastName || req.params.lastName;
    var company_value = req.body.company || req.query.company || req.params.company;
    var phone_value = req.body.phone || req.query.phone || req.params.phone;
    var email_value = req.body.email || req.query.email || req.params.email;

    log.debug("  -> id:                        " + id_value);
    //log.debug("  -> license:                   " + license_value);
    log.debug("  -> firstName:                 " + firstName_value);
    log.debug("  -> lastName:                  " + lastName_value);
    log.debug("  -> company:                   " + company_value);
    log.debug("  -> phone:                     " + phone_value);
    log.debug("  -> email:                     " + email_value);

    if (id_value == null || firstName_value == null || lastName_value == null || company_value == null || phone_value == null || email_value == null) {
      res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
    }
    else
    {

      var driverData = {
          id : id_value,
          firstName : firstName_value,
          lastName : lastName_value,
          company : company_value,
          phone : phone_value,
          email : email_value
      };
      DriverModel.updateDriver(driverData,function(error, data)
      {
          if (data == null)
          {
            res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
          }
          else
          {
            if(data && data.message)
            {
              if (data.message=="bad_request") {
                res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.PARAMETER_ERROR}})
              }
              else {
                res.status(200).json({"response": {"status":0,"data": {"record": [driverData]}}})
              }
            }
            else
            {
              res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
            }
          }
      });
    }
  });

/**
 * @api {post} /driver/ Create new driver
 * @apiName PostNewDriver
 * @apiGroup Driver
 * @apiVersion 1.0.1
 * @apiDescription Create new driver
 * @apiSampleRequest https://api.kyroslbs.com/driver
 *
 * @apiParam {String} license Driver unique ID
 * @apiParam {String} lastName Last name of the driver
 * @apiParam {String} company Company of the driver
 * @apiParam {String} email e-mail of the driver
 *
 * @apiSuccess {String} message Result message
 *
 * @apiSuccessExample Success-Response:
 *     https/1.1 201 OK
 *     {
 *       "response":
 *        {
 *          "status": 0,
 *          "data": {
 *          "record": [
 *          {
 *            "id": 3,
 *            "license": "09121212B",
 *            "creationTime": "2011-11-04T00:00:00Z,
 *            "firstName": "Miguel",
 *            "lastName": "Campoviejo",
 *            "phone": "+34 660519563",
 *            "email": "mcampoviejo@wikinger.com"
 *          }]
 *         }
 *       }
 *     }
 *
 * @apiUse TokenHeader
 * @apiUse LoginError
 * @apiUse TokenError
 * @apiUse TokenExpiredError
 * @apiUse MissingParameterError
 *
*/
router.post("/driver", function(req,res)
{
    log.info("POST: /driver");

    var license_value = req.body.license || req.query.license || req.params.license;
    var firstName_value = req.body.firstName || req.query.firstName || req.params.firstName;
    var lastName_value = req.body.lastName || req.query.lastName || req.params.lastName
    var company_value = req.body.company || req.query.company || req.params.company;
    var phone_value = req.body.phone || req.query.phone || req.params.phone;
    var email_value = req.body.email || req.query.email || req.params.email;

    log.debug("  -> license:                   " + license_value);
    log.debug("  -> firstName:                 " + firstName_value);
    log.debug("  -> lastName:                  " + lastName_value);
    log.debug("  -> company:                   " + company_value);
    log.debug("  -> phone:                     " + phone_value);
    log.debug("  -> email:                     " + email_value);

    if (license_value == null || firstName_value == null || lastName_value == null || company_value == null || phone_value == null || email_value == null) {
      log.debug("Missing parameter");
      res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
    }
    else
    {
      var driverData = {
          id : null,
          license : license_value,
          firstName : firstName_value,
          lastName : lastName_value,
          company : company_value,
          phone : phone_value,
          email : email_value
      };
      DriverModel.insertDriver(driverData,function(error, data)
      {
        if (data == null)
        {
          res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
        }
        else
        {
          if(data && data.insertId)
          {
              driverData.id = data.insertId;

              res.status(201).json({"response": {"status":0,"data": {"record": [driverData]}}})
          }
          else
          {
             res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
          }
        }
      });
  }
});

/**
 * @api {delete} /driver Delete driver
 * @apiName DeleteDriver
 * @apiGroup Driver
 * @apiVersion 1.0.1
 * @apiDescription Delete driver
 * @apiSampleRequest https://api.kyroslbs.com/driver
 *
 * @apiParam {Number} id Driver unique ID
 *
 * @apiSuccess {String} message Result message
 *
 * @apiSuccessExample Success-Response:
 *     https/1.1 200 OK
 *     {
 *       "response":
 *        {
 *          "status": 0,
 *          "data": {
 *          "record": [
 *          {
 *            "id": 3,
 *            "license": "09121212B",
 *            "creationTime": "2011-11-04T00:00:00Z,
 *            "firstName": "Miguel",
 *            "lastName": "Campoviejo",
 *            "company": Wikinger,
 *            "phone": "+34 660519563",
 *            "email": "mcampoviejo@wikinger.com"
 *          }]
 *         }
 *       }
 *     }
 *
 * @apiUse TokenHeader
 * @apiUse LoginError
 * @apiUse TokenError
 * @apiUse TokenExpiredError
 * @apiUse MissingParameterError
 */
router.delete("/driver/", function(req, res)
{
    log.info("DELETE: /driver");

    // id a eliminar
    var id = req.body.id || req.params.id || req.query.id;
    log.debug("  -> id: " + id);

    if (id == null)
    {
      res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
    }
    else
    {
      DriverModel.deleteDriver(id,function(error, data)
      {
            if (data == null)
            {
              res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
            }
            else
            {
                if(data && data.message != "notExist")
                {
                  res.status(200).json({"response": {"status":0,"data": {"record": data}}})
                }
                else
                {
                  res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
                }
            }
        });
    }
  });

module.exports = router;
