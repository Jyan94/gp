'use strict';
require('rootpath')();

var InitContest = require('libs/contestB/modes');
var testConfigs = require('test/testConfigs/testConfigs');
var User = require('libs/cassandra/user');
var ContestBUpdate = require('libs/cassandra/contestB/update');
var UpdateContest = require('libs/cassandra/contestB/update');
var async = require('async');

var testUserParams = testConfigs.testUserParams;
var testContestSettings = testConfigs.testContestSettings;
var ATHLETES_INDEX = 0;
var COMMISSION_EARNED_INDEX = 1;
var DEADLINETIME_INDEX =2 
var CONTEST_END_TIME_INDEX = 3;
var CONTEST_ID_INDEX = 4;
var CONTEST_START_TIME_INDEX = 5;
var CONTEST_STATE_INDEX = 6;
var CONTESTANTS_INDEX = 7;
var CURRENT_ENTRIES_INDEX = 8;
var ENTRIES_ALLOWED_PER_CONTESTANT = 9;
var ENTRY_FEE_INDEX = 10;
var GAME_TYPE_INDEX = 11;
var LAST_LOCKED_INDEX = 12;
var LOCK_CURRENT_ENTRIES_INDEX = 13;
var MAX_WAGER_INDEX = 14;
var MAXIMUM_ENTRIES_INDEX = 15;
var MINIMUM_ENTRIES_INDEX = 16;
var PAYOUTS_INDEX = 17;
var PROCESSED_PAYOUTS_TIMESTAMP_INDEX = 18;
var SPORT_INDEX = 19;
var STARTING_VIRTUAL_MONEY_INDEX = 20;
var TOTAL_PRIZE_POOL_INDEX = 21;
var SETTINGS_LENGTH_OF_CONTEST = 22;

function createUsers(callback) {
  async.each(testUserParams, function(params, callback) {
    params.should.have.length(SETTINGS_LENGTH_OF_CONTEST);
    User.insert(params, callback);
  }, callback);
}

function createContests(callback) {
  async.each(testContestSettings, function(settings, callback) {
    settings[ATHLETES_INDEX] = JSON.stringify(settings[ATHLETES_INDEX]);
    settings[ATHLETES_INDEX].should.be.type('string');
    ContestBUpdate.insert(settings, callback);
  }, callback);
}

function setup(callback) {
  async.waterfall(
  [
    createUsers,
    createContests
  ], callback);
}

exports.testUserParams = testUserParams;
exports.testContestSettings = testContestSettings;
exports.setup = setup;