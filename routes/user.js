var status = require("../utils/statusCodes.js");
var messages = require("../utils/statusMessages.js");
var express = require('express');
var router = express.Router();
var UserModel = require('../models/user');

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

/* POST. Obtenemos y mostramos todos los usuarios */
/*
 * @api {post} /kyrosapi/users Request all users
 * @apiName PostUsers
 * @apiGroup User
 * @apiVersion 1.0.1
 * @apiDescription List of users
 * @apiSampleRequest https://api.kyroslbs.com/kyrosapi/users
 *
 * @apiSuccess {json} users       List of users
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 201
 *     {
 *      "response": {
 *      "status": 0,
 *      "totalRows": 5,
 *      "startRow": 0,
 *      "endRow": 5,
 *      "data": {
 *      "record": [
 *        {
 *          "id": 1,
 *          "username": "catapult",
 *          "password": "ef4095ba96e4950581a6cc5f9de4092a20901a2cfaf9d2a3b02891afceae6e34",
 *          "packages": "administrador"
 *        },
 *        {
 *          "id": 3,
 *          "username": "iberdrola",
 *          "password": "ef4095ba96e4950581a6cc5f9de4092a20901a2cfaf9d2a3b02891afceae6e34",
 *          "packages": "administrador"
 *        },
 *      ]}
 *    }
 *  }
 *
 * @apiUse TokenHeader
 * @apiUse PermissionError
 * @apiUse TokenError
 * @apiUse TokenExpiredError
 */
router.post('/users/', function(req, res)
{
    log.info("POST: /users");

    var startRow = req.body.startRow || req.params.startRow || req.query.startRow;
    var endRow = req.body.endRow || req.params.endRow || req.query.endRow;
    var sortBy = req.body.sortBy || req.params.sortBy || req.query.sortBy;
    // Limpiar espacios en blanco
    if (sortBy!=null) {
      sortBy = sortBy.replace(/\s/g, "");
    }

    UserModel.getUsers(startRow, endRow, sortBy, function(error, data, totalRows)
    {
        if (data == null) {
          res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
        }
        //si existen roles, se envia el json
        else if (typeof data !== 'undefined')
        {
            if (startRow == null || endRow == null) {
              startRow = 0;
              endRow = totalRows;
            }
            res.status(200).json({"response": {"status":0,"totalRows":totalRows,"startRow":parseInt(startRow),"endRow":parseInt(endRow),"data": { "record": data}}})
        }
        //en otro caso se muestra un error
        else
        {
          res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.SERVER_ERROR}})
        }
    });
});

/* GET. Se obtiene uno por su id */
/**
 * @api {get} /kyrosapi/user/:id Request user information
 * @apiName PostUser Request user information
 * @apiGroup User
 * @apiVersion 1.0.1
 * @apiDescription User information
 * @apiSampleRequest https://api.kyroslbs.com/kyrosapi/user
 *
 * @apiParam {Number} id User unique ID
 *
 * @apiSuccess {json} user       User information
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 201
 *     {
 *      "response": {
 *      "status": 0,
 *      "totalRows": 1,
 *      "startRow": 0,
 *      "endRow": 1,
 *      "data": {
 *      "record": [
 *        {
 *          "id": 1,
 *          "username": "crueda",
 *          "password": "ef4095ba96e4950581a6cc5f9de4092a20901a2cfaf9d2a3b02891afceae6e34",
 *          "packages": "administrador"
 *        },
 *      ]}
 *    }
 *    }
 * @apiError UserNotFound The <code>id</code> of the user was not found
 *
 * @apiUse TokenHeader
 * @apiUse TokenError
 * @apiUse TokenExpiredError
 * @apiUse MissingRegisterError
 * @apiUse IdNumericError
 */
router.get('/user/:id', function(req, res)
{
    var id = req.params.id;
    log.info("GET: /user/"+id);

    //se comprueba que la id es un número
    if(!isNaN(id))
    {
        UserModel.getUser(id,function(error, data)
        {
          if (data == null)
          {
            res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.DB_ERROR}})
          }
          else
          {
            //si existe el usuario enviamos el json
            if (typeof data !== 'undefined' && data.length > 0)
            {
                res.status(200).json({"response": {"status":0,"totalRows":1,"startRow":0,"endRow":1,"data": { "record": data}}})
            }
            //en otro caso se muestra un error
            else
            {
                res.status(202).json({"response": {"status":status.STATUS_FAILURE,"description":messages.SERVER_ERROR}})
            }
          }
        });
    }
    //si la id no es numerica se muestra un error de servidor
    else
    {
        res.status(202).json({"response": {"status":status.STATUS_VALIDATION_ERROR,"description":messages.ID_ERROR}})
    }
});

module.exports = router;
