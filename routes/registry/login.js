'use strict';
require('rootpath')();
var express = require('express');
var app = module.exports = express();
var bcrypt = require('bcrypt-nodejs');
var configs = require('config/index');
configs.configure(app);

var async = require('async');
var User = require('libs/cassandra/user');

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
    console.log(result);
    if (err) {
      return done(err);
    }
    if (!result) {
      return done(null, false, {message: messages.incorrect_username});
    }
    //do bcrypt compare here
    bcrypt.compare(password, result.password, function(err, res) {
      console.log(res);
      if (res) {
        return done(null, result);
      } else {
        console.log('boo');
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

app.use(passport.initialize());
app.use(passport.session());

app.route('/login')
.get(function(req, res) {
  var results = [];
  res.render('login.jade', { flash: results });
})
.post(passport.authenticate('local', { successRedirect: '/',
                                   failureRedirect: '/login',
                                   failureFlash: true })
);