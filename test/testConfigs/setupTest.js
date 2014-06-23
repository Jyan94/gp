'use strict';
require('rootpath')();

var InitContest = require('libs/contestB/modes');
var testConfigs = require('test/testConfigs/testConfigs');
var User = require('libs/cassandra/user');
var ContestBUpdate = require('libs/cassandra/contestB/update');
var UpdateContest = require('libs/cassandra/contestB/update');
var CONTESTIDINDEX = 4;
var async = require('async');

var testUserParams = testConfigs.testUserParams;
var testContestSettings = testConfigs.testContestSettings;

function setUpUsers(callback) {
  async.each(testUserParams, function(params, callback) {
    User.insert(params, callback);
  }, callback);
}

function createContest(callback) {
  async.each(testContestSettings, function(settings, callback) {
    ContestBUpdate.insert(settings, callback);
  }, callback);
}

function() {

}