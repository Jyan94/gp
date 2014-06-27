'use strict';
require('rootpath')();
var configs = require('config/index');

var cql = configs.cassandra.cql;
var client = configs.cassandra.client;

var User = require('libs/cassandra/user.js');

var verify = function(req, res, next) {
  User.select('email', req.params.email, function(err, result) {
    var text;
    if (err) {
      next(err);
    }
    else {
      if (result) {
        if (result.verified === true) {
          text = 'Your account is already verified!';
          res.render('verified.jade', {text: text});
        }
        else {
          if (result.ver_code === req.params.ver_code) {
            var userId = result.user_id;
            User.update(userId, ['verified'], [true], function(err) {
              if (err) {
                next(err);
              }
              else {
                text = 'Congratulations, your account is now verified!';
                res.render('verified.jade', {text: text});
              }
            });
          }
          else {
            text = 'Your verificaiton code does not match!';
            res.render('verified.jade', {text: text});
          }
        }
      }
      else {
        text = 'You should not have reached this page!';
        res.render('verified.jade', {text: text});
      }
    }
  });
};

exports.verify = verify;