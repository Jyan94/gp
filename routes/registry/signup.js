'use strict';
require('rootpath')();
var express = require('express');
var app = module.exports = express();
var configs = require('config/index');
configs.configure(app);

var async = require('async');
var bcrypt = require('bcrypt-nodejs');
var User = require('libs/cassandra/user');
var cql = configs.cassandra.cql;

var responseValues = {
  userTaken: 1,
  emailTaken: 2,
  success: 3
};
function insertUser(body, res) {
  /*
    user_id, email, verified, verified_time, username, password, first_name,
    last_name, age, address, payment_info, money, fbid, VIP_status, image
   */
  bcrypt.hash(body.password, null, null, function(err, hash) {
    if (err) {
      console.log(err);
      return;
    }
    console.log(hash);
    var fields = 
    [
      cql.types.uuid(), //user_id
      body.email, //email
      true, //verified
      null, //verfied_time
      body.username, //username
      hash, //password
      body.first_name, //first_name
      body.last_name,  //last_name
      null, //age
      null, //address
      null, //payment_info
      {value: 0.0, hint: 'double'}, //money
      null, //fbid
      0,  //VIP_status
      null //image
    ];
    User.insert(fields, function(err) {
      if (err) {
        console.log(err);
        return;
      }
      res.send({value: responseValues.success});
    });
  });
}

function processSignUp(req, res) {
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
  ], function(err) {
    if (err) {
      console.log(err);
      return;
    }
    insertUser(body, res);
  });
}

app.route('/signup')
.get(function(req, res) {
  res.render('signup');
})
.post(function(req, res) {
  processSignUp(req, res);
});

//app.listen(3000);