'use strict';
require('rootpath')();
var configs = require('config/index');

var async = require('async');
var bcrypt = require('bcrypt-nodejs');
var User = require('libs/cassandra/user');
var cql = configs.cassandra.cql;
var responseValues = configs.constants.signupResponseValues;

function insertUser(body, res, next) {
  var bcryptHashCallback = function(err, hash) {
    if (err) {
      next(err);
    }
    else {
      var fields = 
      [
        cql.types.uuid(), //user_id
        body.email, //email
        true, //verified
        null, //verfied_time
        body.username, //username
        hash, //password
        body.firstName, //first_name
        body.lastName,  //last_name
        null, //age
        null, //address
        null, //payment_info
        {value: 10000.0, hint: 'double'}, //money
        null, //fbid
        0,  //vip_status
        null //image
      ];
      var insertCallback = function(err) {
        if (err) {
          next(err);
        }
        else {
          res.send({value: responseValues.success});
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

var processSignup = function(req, res, next) {
  var body = req.body;
  async.waterfall(
  [
    //username lookup
    function(callback) {
      User.select('username', body.username, function(err, result) {
        if (err) {
          callback(err);
        }
        else if (result) {
          res.send({value: responseValues.userTaken});
        } 
        else {
          callback(null);
        }
      });
    },

    //email lookup
    function(callback) {
      User.select('email', body.email, function(err, result) {
        if (err) {
          callback(err);
        }
        else if (result) {
          res.send({value: responseValues.emailTaken});
        } 
        else {
          callback(null);
        }
      });
    }

  ],

  //callback for when done
  function(err) {
    if (err) {
      next(err);
    }
    else {
      insertUser(body, res, next);
    }   
  });
}

var renderSignup = function(req, res) {
  res.render('signup');
}

//exports
exports.processSignup = processSignup;
exports.renderSignup = renderSignup;