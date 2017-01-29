var status = require("../utils/statusCodes.js");
var messages = require("../utils/statusMessages.js");
var express = require('express');
var router = express.Router();
var PersonnelModel = require('../models/driver');
var moment = require("moment");

// Fichero de propiedades
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

/* POST. Obtenemos y mostramos todos las personnel */
/**
 * @api {post} /kyrosapi/personnels Request all personnels
 * @apiName GetPersonnels
 * @apiGroup Personnel
 * @apiVersion 1.0.1
 * @apiDescription List of personnels
 * @apiSampleRequest https://sumo.kyroslbs.com/kyrosapi/personnels
 *
 * @apiParam {Number} [startRow] Number of first element
 * @apiParam {Number} [endRow] Number of last element
 * @apiParam {String} [sortBy] Sort order on elements (comma separated)
 * @apiParam {String="id","firstName","lastName","license","logType"}  [sortBy]     Results sorting by this param. You may indicate various parameters separated by commas. To indicate descending order you can use the - sign before the parameter
 *
 * @apiSuccess {Object[]} personnel       List of personnels
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
 *            "company": Wikinger,
 *            "role": admin,
 *            "access": 1,
 *            "workingTime": null,
 *            "phone": "+34 660519563",
 *            "email": "mcampoviejo@wikinger.com",
 *            "nok": null
 *          },
 *          {
 *            "id": 4,
 *            "license": "09121212B",
 *            "certificateList": null,
 *            "certificateExpirationList": null,
 *            "firstName": "Luis",
 *            "lastName": "Velez",
 *            "company": Wikinger,
 *            "role": admin,
 *            "access": 1,
 *            "workingTime": null,
 *            "phone": "+34 660519563",
 *            "email": "mcampoviejo@wikinger.com",
 *            "nok": null
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
router.post('/personnels/', function(req, res)
{
    log.info("POST: /personnels");

    var startRow = req.body.startRow || req.params.startRow || req.query.startRow;
    var endRow = req.body.endRow || req.params.endRow || req.query.endRow;
    var sortBy = req.body.sortBy || req.params.sortBy || req.query.sortBy;
    // Limpiar espacios en blanco
    if (sortBy!=null) {
      sortBy = sortBy.replace(/\s/g, "");
    }

    PersonnelModel.getPersonels(startRow, endRow, sortBy, function(error, data, totalRows)
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

/* GET. Se obtiene un personnel por su id */
/**
 * @api {get} /kyrosapi/personnel/:id Request personnel information
 * @apiName GetPersonnel Request personnel information
 * @apiGroup Personnel
 * @apiVersion 1.0.1
 * @apiDescription Personnel information
 * @apiSampleRequest https://sumo.kyroslbs.com/kyrosapi/personnel
 *
 * @apiParam {Number} id Personnel unique ID
 *
 * @apiSuccess {Number} id Personnel unique ID
 * @apiSuccess {String} license License of the personnel
 * @apiSuccess {String} creationTime Creation time of personnel in ISO format
 * @apiSuccess {String} firstName First name of the personnel
 * @apiSuccess {String} lastName Last name of the personnel
 * @apiSuccess {String} company Company of the personnel
 * @apiSuccess {String} role Role of the personnel
 * @apiSuccess {Number} access Access of the personnel. 0=All area, 1=Restricted, 2=Visitor
 * @apiSuccess {Number} workingTime Working time limit of the personnel (in hours)
 * @apiSuccess {String} certificateList List of certificates (string split by comma)
 * @apiSuccess {String} certificateExpirationList list of certificates expiration (epoch split by comma)
 * @apiSuccess {String} email e-mail of the personnel
 * @apiSuccess {String} nok Next of kin of the personnel
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
 *            "certificateList": null,
 *            "certificateExpirationList": null,
 *            "firstName": "Miguel",
 *            "lastName": "Campoviejo",
 *            "company": Wikinger,
 *            "role": admin,
 *            "access": 1,
 *            "workingTime": null,
 *            "phone": "+34 660519563",
 *            "email": "mcampoviejo@wikinger.com",
 *            "nok": null
 *          }]
 *         }
 *       }
 *     }
 *
 * @apiError PersonnelNotFound The <code>id</code> of the personnel was not found
 *
 * @apiUse TokenHeader
 * @apiUse LoginError
 * @apiUse TokenError
 * @apiUse TokenExpiredError
 * @apiUse MissingRegisterError
 * @apiUse IdNumericError
*/
router.get('/personnel/:id', function(req, res)
{
    var id = req.params.id;
    log.info("GET: /personnel/"+id);

    //se comprueba que la id es un número
    if(!isNaN(id))
    {
      PersonnelModel.getPersonnel(id,function(error, data)
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

/* PUT. Actualizamos un personnel existente */
/**
 * @api {put} /kyrosapi/personnel/ Update personnel
 * @apiName PutNewPersonnel
 * @apiGroup Personnel
 * @apiVersion 1.0.1
 * @apiDescription Update personnel information
 * @apiSampleRequest https://sumo.kyroslbs.com/kyrosapi/personnel
 *
 * @apiParam {String} id Personnel unique ID
 * @apiParam {String} lastName Last name of the personnel
 * @apiParam {String} company Company of the personnel
 * @apiParam {String} role Role of the personnel
 * @apiParam {Number} Access Access of the personnel. 0=All area, 1=Restricted, 2=Visitor
 * @apiParam {Number} workingTime Working time limit of the personnel (in hours)
 * @apiParam {String} [certificateList] List of certificates (string split by comma)
 * @apiParam {String} [certificateExpirationList] list of certificates expiration (epoch split by comma)
 * @apiParam {String} email e-mail of the personnel
 * @apiParam {String} nok Next of kin of the personnel
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
router.put('/personnel/', function(req, res)
{
    log.info("PUT: /personnel");

    var id_value = req.body.id || req.query.id || req.params.id;
    //var license_value = req.body.license || req.query.license || req.params.license;
    var firstName_value = req.body.firstName || req.query.firstName || req.params.firstName;
    var lastName_value = req.body.lastName || req.query.lastName || req.params.lastName;
    var company_value = req.body.company || req.query.company || req.params.company;
    var role_value = req.body.role || req.query.role || req.params.role;
    var access_value = req.body.access || req.query.access || req.params.access;
    var workingTime_value = req.body.workingTime || req.query.workingTime || req.params.workingTime;
    var certificateList_value = req.body.certificateList || req.certificateList || req.params.certificateList;
    var certificateExpirationList_value = req.body.certificateExpirationList || req.query.certificateExpirationList || req.params.certificateExpirationList;
    var phone_value = req.body.phone || req.query.phone || req.params.phone;
    var email_value = req.body.email || req.query.email || req.params.email;
    var nok_value = req.body.nok || req.query.nok || req.params.nok;

    log.debug("  -> id:                        " + id_value);
    //log.debug("  -> license:                   " + license_value);
    log.debug("  -> firstName:                 " + firstName_value);
    log.debug("  -> lastName:                  " + lastName_value);
    log.debug("  -> company:                   " + company_value);
    log.debug("  -> role:                      " + role_value);
    log.debug("  -> access:                    " + access_value);
    log.debug("  -> workingTime:               " + workingTime_value);
    log.debug("  -> certificateList:           " + certificateList_value);
    log.debug("  -> certificateExpirationList: " + certificateExpirationList_value);
    log.debug("  -> phone:                     " + phone_value);
    log.debug("  -> email:                     " + email_value);
    log.debug("  -> nok:                       " + nok_value);

    if (id_value == null || firstName_value == null || lastName_value == null || company_value == null || role_value == null || access_value == null || workingTime_value == null || phone_value == null || email_value == null || nok_value == null) {
      res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
    }
    else if (access_value != 0 && access_value != 1 && access_value != 2) {
      res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.PARAMETER_ERROR}})
    }
    else
    {

      // Actualizar el personnel
      var personnelData = {
          id : id_value,
          firstName : firstName_value,
          lastName : lastName_value,
          company : company_value,
          role : role_value,
          access : access_value,
          workingTime : workingTime_value,
          certificateList : certificateList_value,
          certificateExpirationList : certificateExpirationList_value,
          phone : phone_value,
          email : email_value,
          nok : nok_value
      };
      PersonnelModel.updatePersonnel(personnelData,function(error, data)
      {
          if (data == null)
          {
            res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
          }
          else
          {
            //si se ha actualizado correctamente mostramos un mensaje
            if(data && data.message)
            {
              if (data.message=="bad_request") {
                res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.PARAMETER_ERROR}})
              }
              else {
                // Enviar evento
                var eventManager = new EventManager();
                var eventData = {
                    eventType : properties.get('sumo.event.personnel.updated'),
                    resourceId: id_value
                };
                eventManager.sendEvent(eventData);

                res.status(200).json({"response": {"status":0,"data": {"record": [personnelData]}}})
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
 * @api {post} /kyrosapi/personnel/ Create new personnel
 * @apiName PostNewPersonnel
 * @apiGroup Personnel
 * @apiVersion 1.0.1
 * @apiDescription Create new personnel
 * @apiSampleRequest https://sumo.kyroslbs.com/kyrosapi/personnel
 *
 * @apiParam {String} license Personnel unique ID
 * @apiParam {String} lastName Last name of the personnel
 * @apiParam {String} company Company of the personnel
 * @apiParam {String} role Role of the personnel
 * @apiParam {Number} Access Access of the personnel. 0=All area, 1=Restricted, 2=Visitor
 * @apiParam {Number} workingTime Working time limit of the personnel (in hours)
 * @apiParam {String} [certificateList] List of certificates (string split by comma)
 * @apiParam {String} [certificateExpirationList] list of certificates expiration (epoch split by comma)
 * @apiParam {String} email e-mail of the personnel
 * @apiParam {String} nok Next of kin of the personnel
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
 *
*/
router.post("/personnel", function(req,res)
{
    log.info("POST: /personnel");

    var license_value = req.body.license || req.query.license || req.params.license;
    var firstName_value = req.body.firstName || req.query.firstName || req.params.firstName;
    var lastName_value = req.body.lastName || req.query.lastName || req.params.lastName
    var company_value = req.body.company || req.query.company || req.params.company;
    var role_value = req.body.role || req.query.role || req.params.role;
    var access_value = req.body.access || req.query.access || req.params.access;
    var workingTime_value = req.body.workingTime || req.query.workingTime || req.params.workingTime;
    var certificateList_value = req.body.certificateList || req.params.certificateList || req.params.certificateList;
    var certificateExpirationList_value = req.body.certificateExpirationList || req.params.certificateExpirationList || req.params.certificateExpirationList;
    var phone_value = req.body.phone || req.query.phone || req.params.phone;
    var email_value = req.body.email || req.query.email || req.params.email;
    var nok_value = req.body.nok || req.query.nok || req.params.nok;

    log.debug("  -> license:                   " + license_value);
    log.debug("  -> firstName:                 " + firstName_value);
    log.debug("  -> lastName:                  " + lastName_value);
    log.debug("  -> company:                   " + company_value);
    log.debug("  -> role:                      " + role_value);
    log.debug("  -> access:                    " + access_value);
    log.debug("  -> workingTime:               " + workingTime_value);
    log.debug("  -> certificateList:           " + certificateList_value);
    log.debug("  -> certificateExpirationList: " + certificateExpirationList_value);
    log.debug("  -> phone:                     " + phone_value);
    log.debug("  -> email:                     " + email_value);
    log.debug("  -> nok:                       " + nok_value);

    if (license_value == null || firstName_value == null || lastName_value == null || company_value == null || role_value == null || access_value == null || workingTime_value == null || phone_value == null || email_value == null || nok_value == null) {
      log.debug("Missing parameter");
      res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
    }
    else if (access_value != 0 && access_value != 1 && access_value != 2) {
      res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.PARAMETER_ERROR}})
    }
    else
    {
      // Crear un objeto con los datos a insertar
      var personnelData = {
          id : null,
          license : license_value,
          firstName : firstName_value,
          lastName : lastName_value,
          company : company_value,
          role : role_value,
          access : access_value,
          workingTime : workingTime_value,
          certificateList : certificateList_value,
          certificateExpirationList : certificateExpirationList_value,
          phone : phone_value,
          email : email_value,
          nok : nok_value
      };
      PersonnelModel.insertPersonnel(personnelData,function(error, data)
      {
        if (data == null)
        {
          res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
        }
        else
        {
          // si se ha insertado correctamente mostramos su messaje de exito
          if(data && data.insertId)
          {
              personnelData.id = data.insertId;

              // Enviar evento
              var eventManager = new EventManager();
              var eventData = {
                  eventType : properties.get('sumo.event.personnel.added'),
                  resourceId: personnelData.id
              };
              eventManager.sendEvent(eventData);

              res.status(201).json({"response": {"status":0,"data": {"record": [personnelData]}}})
          }
          else
          {
             res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
          }
        }
      });
  }
});

/* DELETE. Eliminar personnel */
/**
 * @api {delete} /kyrosapi/personnel Delete personnel
 * @apiName DeletePersonnel
 * @apiGroup Personnel
 * @apiVersion 1.0.1
 * @apiDescription Delete personnel
 * @apiSampleRequest https://sumo.kyroslbs.com/kyrosapi/personnel
 *
 * @apiParam {Number} id Personnel unique ID
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
 *            "role": admin,
 *            "access": 1,
 *            "workingTime": null,
 *            "phone": "+34 660519563",
 *            "email": "mcampoviejo@wikinger.com",
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
router.delete("/personnel/", function(req, res)
{
    log.info("DELETE: /personnels");

    // id a eliminar
    var id = req.body.id || req.params.id || req.query.id;
    log.debug("  -> id: " + id);

    if (id == null)
    {
      res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.MISSING_PARAMETER}})
    }
    else
    {
      PersonnelModel.deletePersonnel(id,function(error, data)
      {
            if (data == null)
            {
              res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
            }
            else
            {
                if(data && data.message != "notExist")
                {
                  // Enviar evento
                  var eventManager = new EventManager();
                  var eventData = {
                      eventType : properties.get('sumo.event.personnel.removed'),
                      resourceId: id
                  };
                  eventManager.sendEvent(eventData);

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
