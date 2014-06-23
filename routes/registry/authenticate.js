'use strict';
require('rootpath')();
var bcrypt = require('bcrypt-nodejs');

var async = require('async');
var User = require('libs/cassandra/user');

var configs = require('config/index');
var cql = configs.cassandra.cql;

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;

var messages = configs.constants.auth;

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

passport.use(new FacebookStrategy({
    clientID: "855194074508903",
    clientSecret: "f0eba05b866e9921a7d88071d800bb72",
    callbackURL: "http://localhost:3000/auth/facebook/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    process.nextTick(function() {
      //console.log(profile.name.givenName);
      //console.log(profile.id);
      var profileUsername = profile.name.givenName + profile.id
      User.select('email', profileUsername, function(err, result) {
        console.log(result);
        if (err) {
          return done(err);
        }
        else if (result) {
          return done(null, result);
        }
        else {
          var fields = [
            cql.types.uuid(), //user_id
            profileUsername, //fb email
            true, //verified
            null, //verified_time
            profileUsername, //fb username and fb email is the same
            null, //no password since login through facebook
            profile.name.givenName, //first_name
            profile.name.familyName, //last_name
            null, //age
            null, //address
            null, //payment_info
            {value: 10000.0, hint: 'double'}, //money
            profile.id, //fb id
            0, //vip_status
            null //image
          ];
          User.insert(fields, function(err) {
            if (err) {
              return done(err);
            }
            else {
              User.select('email', profileUsername, function(err, user) {
                if (err) {
                  done(err);
                }
                else {
                  return done(null, user);
                }
              })
            }
          })
        }
      })
    })
  }
));

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