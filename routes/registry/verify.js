'use strict';
require('rootpath')();
var configs = require('config/index');

var cql = configs.cassandra.cql;
var client = configs.cassandra.client;
var verificationMessages = configs.constants.verificationMessages;

var User = require('libs/cassandra/user.js');

var verify = function(req, res, next) {
  var updateVerifiedCallback = function(err) {
    if (err) {
      next(err);
    }
    else {
      res.render(
        'registry/verified.jade', 
        {text: verificationMessages.verified});
    }
  };

  var notVerified = function(result) {
    if (result.ver_code === req.params.verCode) {
      var userId = result.user_id;
      User.update(userId, ['verified'], [true], updateVerifiedCallback);
    }
    else {
      res.render(
        'registry/verified.jade', 
        {text: verificationMessages.noMatch});
    }
  };

  var checkIfVerified = function(result) {
    if (result.verified === true) {
      res.render(
        'registry/verified.jade', 
        {text: verificationMessages.alreadyVerified});
    }
    else {
      notVerified(result);
    }
  };

  var emailSelectCallback = function(err, result) {
    if (err) {
      next(err);
    }
    else if (result) {
      checkIfVerified(result);
    }
    else {
      res.render(
        'registry/verified.jade', 
        {text: verificationMessages.invalidPage});
    }
  };

  User.select('email', req.params.email, emailSelectCallback);
};

exports.verify = verify;