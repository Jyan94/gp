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
    //console.log(result);
    if (err) {
      return done(err);
    }
    if (!result) {
      return done(null, false, {message: messages.incorrect_username});
    }
    //do bcrypt compare here
    bcrypt.compare(password, result.password, function(err, res) {
      //console.log(res);
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

/*
var FacebookStrategy = require('passport-facebook').Strategy;

  passport.use(new FacebookStrategy({
      clientID: "656697897711155",
      clientSecret: "da59fa7c8e4cc617c40793b45ac31b97",
      callbackURL: "https://localhost:8443/auth/facebook/callback"
    },
    function(accessToken, refreshToken, profile, done) {
      // asynchronous verification, for effect...
      process.nextTick(function () {
        User.select('email', profile.username, function(err, result){
          if (err) {
            return done(err);
          }
          else if (result.rows[0]) {
            return done(null, result.rows[0]);
          }
          else {
            var user_id = cql.types.uuid();
            User.insert('user_id', 'fbid', 'email', 'first_name', 'image', 'last_name')
          }
        })
        var query0 = 'SELECT * FROM users WHERE email = ?';
        client.executeAsPrepared(query0, [profile.username], cql.types.consistencies.one, function(err, result) {

          else if (result.rows[0]) {
            var query1 = 'SELECT * FROM users WHERE email = ?';
            client.executeAsPrepared(query1, [profile.username], cql.types.consistencies.one, function(err, user) {
              if (err) {
                return done(err);
              }
              else {
                return done(null, user.rows[0]);
              }
            });
          }
          else {
            var user_id = cql.types.uuid();

            var query2 = 'INSERT INTO users (user_id, fbid, email, first_name, image, last_name) values (?, ?, ?, ?, ?, ?)';

            client.executeAsPrepared(query2, [user_id, profile.id, profile.username,
                                     profile.name.givenName, strings.anonymous,
                                     profile.name.familyName],
                                     cql.types.consistencies.one,
                                     function(err, result) {
              if (err) {
                return done(err);
              }
              else {
                query1 = 'SELECT * FROM users WHERE email = ?';
                client.executeAsPrepared(query1, [profile.username],
                               cql.types.consistencies.one, function (err, user) {
                  if (err) {
                    return done(err);
                  }
                  else {
                    return done(null, user.rows[0]);
                  }
                });
              }
            });
          }
        });
      });
    }
  ));
*/
passport.serializeUser(function (user, done) {
  done(null, user.user_id);
});

passport.deserializeUser(function (id, done) {
  User.select('user_id', id, function(err, result){
    done(err, result);
  });
});