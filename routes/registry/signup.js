'use strict';
require('rootpath')();
var configs = require('config/index');

var async = require('async');
var bcrypt = require('bcrypt-nodejs');
var User = require('libs/cassandra/user');
var cql = configs.cassandra.cql;
var responseValues = configs.constants.signupResponseValues;

var defaultPlayerImage = configs.constants.defaultPlayerImage
var nodemailer = require('nodemailer');
var constantCreateTransport = configs.constants.createTransport;

var smtpTransport = nodemailer.createTransport('SMTP', {
  service: 'Gmail',
  auth: {
    user: 'goprophetteam@gmail.com',
    pass: 'goteamgp'
  }
});

function insertUser(body, res, next) {
  var bcryptHashCallback = function(err, hash) {
    if (err) {
      next(err);
    }
    else {
      var verCode = cql.types.timeuuid();
      var userId = cql.types.uuid();
      var fields =
      [
        userId, //user_id
        body.email, //email
        false, //verified
        null, //verfied_time
        verCode, //ver_code
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
      var insertCallback = function(err) {
        if (err) {
          next(err);
        }
        else {
          var MailOptions = {
            from: "goprophetteam@gmail.com",
            to: body.email,
            subject: 'Welcome to GoProphet',
            text: 'Welcome to GoProphet.  To verify your account, go to',
            html: '<a href = http://localhost:3000/verify/' + body.email + '/' + verCode + '> Verify My Account </a>'
          }
          smtpTransport.sendMail(MailOptions, function(err, response) {
            if (err) {
              next(err);
            }
            else {
              res.send({value: responseValues.success});
            }
          });
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