'use strict';
require('rootpath')();
var bcrypt = require('bcrypt-nodejs');

var async = require('async');
var User = require('libs/cassandra/user');

var configs = require('config/index');
var cql = configs.cassandra.cql;

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var messages = {
  incorrect_username: {
    "title": "Incorrect username",
    "parts":
    ["We couldn\'t find any user with the username you provided.",
    "Please try a different username and try again, or sign up."]
  },
  incorrect_password: {
    "title": "Incorrect password",
    "parts":
    ["The provided username and password didn\'t match anyone in our records.",
    "Please check your spelling and try again."]
  }
};

function localStrategyVerify(username, password, done) {
  User.select('username', username, function (err, result) {
    if (err) {
      return done(err);
    }
    if (!result) {
      return done(null, false, {message: messages.incorrect_username});
    }
    bcrypt.compare(password, result.password, function(err, res) {
      if (res) {
        return done(null, result);
      } else {
        return done(null, false, {message: messages.incorrect_password});
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
  done(null, user.user_id);
});

passport.deserializeUser(function (id, done) {
  User.select('user_id', id, function(err, result){
    done(err, result);
  });
});