'use strict';
require('rootpath')();

var async = require('async');
var bcrypt = require('bcrypt-nodejs');
var configs = require('config/index');
var nodemailer = require('nodemailer');
var User = require('libs/cassandra/user');
var constants = configs.constants;
var cql = configs.cassandra.cql;
var responseValues = constants.signupResponseValues;

var defaultPlayerImage = constants.defaultPlayerImage;
var SMTP = constants.SMTP;
var smtpTransport = nodemailer.createTransport(SMTP.name, SMTP.configObject);

function insertUser(uuid, body, res, next) {
  var bcryptHashCallback = function(err, hash) {
    if (err) {
      next(err);
    }
    else {
      var userId = uuid;
      var verificationCode = cql.types.timeuuid();
      var verified = false;
      if (configs.isDev()) {
        verified = true;
      }
      var fields =
      [
        userId, //user_id
        body.email, //email
        verified, //verified
        null, //verfied_time
        verificationCode, //verification_code
        body.username, //username
        hash, //password
        body.firstName, //first_name
        body.lastName,  //last_name
        null, //age
        null, //address
        null, //payment_info
        {value: 10000.0, hint: 'double'}, //money
        {value: 10000.0, hint: 'double'}, //spending_power
        null, //fbid
        0,  //vip_status
        defaultPlayerImage //image
      ];
      var sendMailCallback = function(err, response) {
        if (err) {
          next(err);
        }
        else {
          res.send({value: responseValues.success});
        }
      };
      var insertCallback = function(err) {
        if (err) {
          next(err);
        }
        else if (configs.isDev()){
          res.send({value: responseValues.success});
        }
        else {
          var MailOptions = 
            SMTP.createMailOptions(body.email, verificationCode);
          smtpTransport.sendMail(MailOptions, sendMailCallback);
        }
      };
      User.insert(fields, insertCallback);
    }
  };
  /*
  user_id, email, verified, verified_time, username, password, first_name,
  last_name, age, address, payment_info, money, fbid, vip_status, image
 */
  bcrypt.hash(body.password, null, null, bcryptHashCallback);
}

function verifyUniqueUuid(uuid, callback) {
  while (constants.globals.notADefaultUserUuid(uuid)) {
    uuid = cql.types.uuid();
  }
  User.selectById(uuid, function(err, result) {
    if (err) {
      callback(err);
    }
    else if (result) {
      uuid = cql.types.uuid();
      verifyUniqueUuid(uuid, callback);
    }
    else {
      callback(null);
    }
  });
}

var processSignup = function(req, res, next) {
  var body = req.body;
  var uuid = cql.types.uuid();
  
  async.waterfall(
  [
    //username lookup
    function(callback) {
      var selectUsernameCallback = function(err, result) {
        if (err) {
          callback(err);
        }
        else if (result) {
          res.send({value: responseValues.userTaken});
        }
        else {
          callback(null);
        }
      };

      User.selectByUsername(body.username, selectUsernameCallback);
    },

    //email lookup
    function(callback) {
      var selectEmailCallback = function(err, result) {
        if (err) {
          callback(err);
        }
        else if (result) {
          res.send({value: responseValues.emailTaken});
        }
        else {
          callback(null);
        }
      };

      User.selectByEmail(body.email, selectEmailCallback);
    },

    //verify uuid
    function(callback) {
      verifyUniqueUuid(uuid, callback);
    }
  ],
  function(err) {
    if (err) {
      next(err);
    }
    else {
      insertUser(uuid, body, res, next);
    }
  });
}

var renderSignup = function(req, res) {
  res.render('registry/signup');
}

//exports
exports.processSignup = processSignup;
exports.renderSignup = renderSignup;