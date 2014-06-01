require('rootpath')();
var express = require('express');
var app = module.exports = express();
var configs = require('config/index');
configs.configure(app);

var async = require('async');
var User = require('models/user');
var bet = require('models/bet');
var cql = configs.cassandra.cql;

var messages = {
  incorrect_username: '{ "title": "Incorrect username", "parts": ["We couldn\'t find any user with the username you provided.", "Please try again with a different username."] }'
  };

function retrieveProfile(req, res) {
  var userInfo = {};
  var betInfo = [];
  var field = '';

  async.waterfall([
    function (callback) {
      User.select('username', req.params.username, function (err, result) {
        if (err) {
          callback(err);
        }

        if (result) {
          console.log(result);
          
          for (var i = 0; i < result.columns.length; i++) {
            field = result.columns[i].name;

            if (result[field] === null) {
              userInfo[field] = 'Unavailable';
            }
            else {
              userInfo[field] = result[field];
            }
          }

          callback(null, result);
        }
        else {
          res.send(messages.incorrect_username);
        }
      });
    },
    function (arg1, callback) {
      bet.selectUsingUserID('all_bets', arg1.user_id, function (err, result) {
        if (err) {
          callback(err);
        }

        betInfo = result;
        callback(null, result);
      });
    }
  ], function(err, result) {
    if (err) {
      console.log(err);
      return;
    }

    res.render('profile', { userInfo: userInfo, 
                            betInfo: betInfo
    });
  });
}

/*function updateProfile(req, res) {
  var profileInfo = {}

  async.waterfall([
    function (callback) {
      User.select('username', req.params.username, function (err, result) {
        if (err) {
          callback(err);
        }

        if (result) {
          console.log(result);
          profileInfo.userInfo = result;
          callback(null, result);
        }
        else {
          res.send(messages.incorrect_username);
        }
      });
    },
    function (userInfo, callback) {
      bet.selectUsingUserID('pending_bets', userInfo.user_id, function (err, result) {
        if (err) {
          callback(err);
        }

        if (result) {
          profileInfo.betInfo = result;
          callback(null, result);
        }
      });
    }
  ], function(err, result) {
    if (err) {
      console.log(err);
      return;
    }

    res.send(profileInfo);
  });
}*/

app.route('/user')
.get(function (req, res) {
  req.params.username = '';
  retrieveProfile(req, res);
});

app.route('/user/:username')
.get(function (req, res) {
  retrieveProfile(req, res);
})
/*.post(function (req, res) {
  updateProfile(req, res);
})*/;

app.listen(3000);