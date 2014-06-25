'use strict';
require('rootpath')();

var testConfigs = require('test/testConfigs/testConfigs');
var UpdateContest = require('libs/cassandra/contestB/update');
var User = require('libs/cassandra/user');
var async = require('async');

var CONTEST_ID_INDEX = 4;

var testUserParams = testConfigs.testUserParams;
var testContestSettings = testConfigs.testContestSettings;

function takedownUsers(callback) {
  async.each(testUserParams, function(params, callback) {
    User.delete(params[0], callback);
  }, callback);
}

function deleteContest(callback) {
  async.each(testContestSettings, function(setting, callback) {
    UpdateContest.delete(setting[CONTEST_ID_INDEX], callback);
  }, callback);
  UpdateContest.delete(contestId, callback);
}

function takedown(callback) {
  async.waterfall(
  [
    takedownUsers,
    deleteContest
  ], callback);
}
exports.takedown = takedown;