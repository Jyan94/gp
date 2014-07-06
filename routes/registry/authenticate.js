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

var FacebookStrategyObj = configs.constants.FacebookStrategy;
var LocalStrategyObject = configs.constants.PassportLocalStrategyObject;
var defaultPlayerImage = configs.constants.defaultPlayerImage;
var messages = configs.constants.auth;

function localStrategyVerify(username, password, done) {
  var selectCallback = function (err, result) {
    if (err) {
      return done(err);
    }
    if (!result) {
      return done(null, false, {message: messages.incorrectUsername});
    }
    if (result.verified === false) {
      return done(null, false, { message: messages.unverified });
    }
    var bcryptCallback = function(err, res) {
      if (res) {
        return done(null, result);
      } else {
        return done(null, false, {message: messages.incorrectPassword});
      }
    };

    bcrypt.compare(password, result.password, bcryptCallback);
  };

  User.selectByUsername(username, selectCallback);
}

passport.use(new FacebookStrategy(FacebookStrategyObj,
  function(accessToken, refreshToken, profile, done) {
    var profileUsername = profile.name.givenName + profile.id;

    //callback for attempting to select user using email after inserting user
    var userEmailAfterInsertCallback = function(err, user) {
      if (err) {
        done(err);
      }
      else {
        return done(null, user)
      }
    };

    //callback for inserting into user
    var insertUserCallback = function(err) {
      if (err) {
        return done(err);
      }
      else {
        User.selectByEmail(profileUsername, userEmailAfterInsertCallback);
      }
    };

    //callback for selecting user based on email
    var selectEmailCallback = function(err, result) {
      if (err) {
        return done(err);
      }
      else if (result) {
        return done(null, result);
      }
      else {
        var verifiedTime = null;
        var verified = false;
        var verificationCode = null;
        if (configs.isDev()) {
          verified = true;
          verifiedTime = new Date();
          verificationCode = cql.types.timeuuid();
        }
        var fields = [
          cql.types.uuid(), //user_id
          profileUsername, //fb email
          verified, //verified
          verifiedTime, //verified_time
          verificationCode, // no ver_code
          profileUsername, //fb username and fb email is the same
          null, //no password since login through facebook
          profile.name.givenName, //first_name
          profile.name.familyName, //last_name
          null, //age
          null, //address
          null, //payment_info
          {value: 10000.0, hint: 'double'}, //money
          {value: 10000.0, hint: 'double'}, //spending_power
          profile.id, //fb id
          0, //vip_status
          defaultPlayerImage //image
        ];
        User.insert(fields, insertUserCallback);
      }
    };

    process.nextTick(function() {
      User.selectByEmail(profileUsername, selectEmailCallback);
    });
  }
));

passport.use(new LocalStrategy(
  LocalStrategyObject,
  function(username, password, done) {
    localStrategyVerify(username, password, done);
  }));

passport.serializeUser(function (user, done) {
  done(null, user.user_id);
});

passport.deserializeUser(function (id, done) {
  User.selectById(id, done);
});