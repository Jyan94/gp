/**
 * =============================================================================
 * Author: Harrison Zhao
 * Documentation:
 *   README: success for signup is when res.send obj does not have field message
 * =============================================================================
 */
'use strict';
require('rootpath')();

var async = require('async');
var bcrypt = require('bcrypt-nodejs');
var configs = require('config/index');
var nodemailer = require('nodemailer');
var User = require('libs/cassandra/user');
var constants = configs.constants.signup;
var cql = configs.cassandra.cql;

var defaultPlayerImage = configs.constants.defaultPlayerImage;
var SMTP = configs.constants.SMTP;
var smtpTransport = nodemailer.createTransport(SMTP.name, SMTP.configObject);

function insertUser(uuid, body, req, res, next) {
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
        null, //age
        body.email, //email
        null, //facebook_id
        null, //first_name
        defaultPlayerImage, //image
        null, //last_name
        10000.0, //starting money
        hash, //password
        null, //payment_info
        0, //privilege level
        userId, //user_id
        body.username, //username
        verificationCode, //verification_code
        verified, //verified
        null //verication_time
      ];
      /*var sendMailCallback = function(err, response) {
        if (err) {
          next(err);
        }
        else {
          res.send({message: responseValues.success});
        }
      };*/
      var redirectSignup = function() {
        async.waterfall(
        [
          function(callback) {
            User.selectById(uuid, callback);
          },
          function(user, callback) {
            req.login(user, function(err) {
              callback(err);
            });
          }
        ],
        function(err) {
          if (err) {
            next(err);
          }
          else {
            res.send({});
          }
        });
      };
      var insertCallback = function(err) {
        if (err) {
          next(err);
        }
        else {
          redirectSignup();
        }
        //add in verification eventually
        /*else if (configs.isDev()){
          //res.send({value: responseValues.success});
          User.selectById(uuid, function(err, result) {
            if (err) {
              res.send({message: 'Cannot redirect signup', status: 500});
            }
            else {
              req.login(result, function (err) {
                if (err) {
                  return next(err);
                }
                else {
                  return res.redirect('/user');
                }
              });
            }
          });
        }
        else {
          var MailOptions = 
            SMTP.createMailOptions(body.email, verificationCode);
          smtpTransport.sendMail(MailOptions, sendMailCallback);
        }*/
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

function validateEmail(email) {
/*jshint ignore:start*/ 
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
/*jshint ignore:end*/
} 

var processSignup = function(req, res, next) {
  var body = req.body;
  if (!(body.username && body.email && body.password && body.verifyPassword)) {
    res.send({message: 'must fill out all fields'});
  }
  else if (body.password !== body.verifyPassword) {
    res.send({message: 'passwords do not match'});
  }
  else if (!body.username.match(/^[0-9a-zA-Z_]+$/)) {
    res.send({
      message: 'cannot have special characters or spaces in username'
    });
  }
  else if (body.username.length < constants.MINIMUM_USERNAME_LENGTH) {
    res.send({
      message: 'username cannot be fewer than ' + 
        constants.MINIMUM_USERNAME_LENGTH +
        ' characters'
    });
  }
  else if (body.password.length < constants.MINIMUM_PASSWORD_LENGTH) {
    res.send({
      message: 'password cannot be fewer than ' +
        constants.MINIMUM_PASSWORD_LENGTH +
        ' characters'
    });
  }
  else if (!validateEmail(body.email)) {
    res.send({
      message: 'invalid email format'
    });
  }
  else {
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
            res.send({
              message: 'username: ' + body.username + ' is already taken!'
            });
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
            res.send({
              message: 'email: ' + body.email + ' is already registered!'
            });
          }
          else {
            callback(null);
          }
        };

        User.selectByEmail(body.email, selectEmailCallback);
      }
    ],
    function(err) {
      if (err) {
        next(err);
      }
      else {
        insertUser(uuid, body, req, res, next);
      }
    });
  }
}

var renderSignup = function(req, res) {
  res.render('registry/signup.html');
}

//exports
exports.processSignup = processSignup;
exports.renderSignup = renderSignup;