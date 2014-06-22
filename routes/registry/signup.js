'use strict';
require('rootpath')();
var configs = require('config/index');

var async = require('async');
var bcrypt = require('bcrypt-nodejs');
var User = require('libs/cassandra/user');
var cql = configs.cassandra.cql;

var responseValues = {
  userTaken: 1,
  emailTaken: 2,
  success: 3
};

function insertUser(body, res, next) {
  /*
    user_id, email, verified, verified_time, username, password, first_name,
    last_name, age, address, payment_info, money, fbid, vip_status, image
   */
  bcrypt.hash(body.password, null, null, function(err, hash) {
    if (err) {
      next(err);
    }
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
    User.insert(fields, function(err) {
      if (err) {
        next(err);
      }
      res.send({value: responseValues.success});
    });
  });
}

var processSignup = function(req, res, next) {
  var body = req.body;
  async.waterfall([
    //username lookup
    function(callback) {
      User.select('username', body.username, function(err, result) {
        if (err) {
          callback(err);
        }
        if (result) {
          res.send({value: responseValues.userTaken});
        } else {
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
        if (result) {
          res.send({value: responseValues.emailTaken});
        } else {
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
    insertUser(body, res, next);
  });
}

var renderSignup = function(req, res) {
  res.render('signup');
}

//exports
exports.processSignup = processSignup;
exports.renderSignup = renderSignup;