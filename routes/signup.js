require('rootpath')();
var express = require('express');
var app = module.exports = express();
var configs = require('config/index');
configs.configure(app);

var async = require('async');
var User = require('models/user');
var cql = configs.cassandra.cql;

var responseValues = {
  userTaken: 1,
  emailTaken: 2,
  success: 3
};

function processSignUp(req, res) {
  var body = req.body;
  console.log(body);
  async.waterfall([
    //username lookup
    function(callback) {
      User.select('username', body.username, function(err, result) {
        if (err) {
          callback(err);
        }
        if (result) {
          console.log('1');
          console.log(result);
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
          console.log('2');
          console.log(result);
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
    /*
      user_id, email, verified, verified_time, username, password, first_name,
      last_name, age, address, payment_info, money, fbid, VIP_status
     */
    var fields = 
    [
    cql.types.uuid(), //user_id
    body.email, //email
    true, //verified
    null, //verfied_time
    body.username, //username
    body.password, //password
    body.first_name, //first_name
    body.last_name,  //last_name
    null, //age
    null, //address
    null, //payment_info
    0, //money
    null, //fbid
    0  //VIP_status
    ];
    User.insert(fields, function(err) {
      console.log(err);
    });
  });
}


app.route('/signup')
.get(function(req, res) {
  res.render('signup');
})
.post(function(req, res) {
  processSignUp(req, res);
});

app.listen(3000);