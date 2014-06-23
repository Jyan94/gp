'use strict';
require('rootpath')();

var testConfigs = require('test/testConfigs/testConfigs');
var UpdateContest = require('libs/cassandra/contestB/update');
var User = require('/libs/cassandra/user');
var async = require('async');

var CONTESTIDINDEX = 4;

var testUserParams = testConfigs.testUserParams;
var testContestSettings = testConfigs.testContestSettings;

function takedownUsers(callback) {
  async.each(testUserParams, function(params, callback) {
    User.delete(params[0], callback);
  }, callback);
}

function deleteContest(callback) {
  async.each(testContestSettings, function(setting, callback) {
    UpdateContest.delete(setting[CONTESTIDINDEX], callback);
  }, callback);
  UpdateContest.delete(contestId, callback);
}

(function() {
  async.waterfall([
    takedownUsers,
    deleteContest
  ], function (err) {
    if (err) {
      console.log(err);
    }
  })
}());