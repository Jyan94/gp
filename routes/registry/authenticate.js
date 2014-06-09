'use strict';
require('rootpath')();
var bcrypt = require('bcrypt-nodejs');

var async = require('async');
var User = require('libs/cassandra/user');

var configs = require('config/index');
var cql = configs.cassandra.cql;

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var messages = configs.constants.auth;

function localStrategyVerify(username, password, done) {
  User.select('username', username, function (err, result) {
    if (err) {
      return done(err);
    }
    if (!result) {
      return done(null, false, {message: messages.incorrectUsername});
    }
    bcrypt.compare(password, result.password, function(err, res) {
      if (res) {
        return done(null, result);
      } else {
        return done(null, false, {message: messages.incorrectPassword});
      }
    });
  });
}

passport.use(new LocalStrategy({
  usernameField: 'username',
  passwordField: 'password'
},
function(username, password, done) {
  localStrategyVerify(username, password, done);
}));

passport.serializeUser(function (user, done) {
  done(null, user.userId);
});

passport.deserializeUser(function (id, done) {
  User.select('userId', id, function(err, result){
    done(err, result);
  });
});