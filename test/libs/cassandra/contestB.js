/**
 * ====================================================================
 * Author: Harrison Zhao
 * ====================================================================
 */
'use strict';
(require('rootpath')());

var setupTest = require('test/testConfigs/setupTest');
var testUserParams = setupTest.testUserParams;
var testContestSettings = setupTest.testContestSettings[0];
setupTest.setup();

var AddContestant = require('libs/cassandra/contestB/addContestant');
var Lock = require('libs/cassandra/contestB/lock');
var RemoveContestant = require('libs/cassandra/contestB/RemoveContestant');
var SelectContest = require('libs/cassandra/contestB/select');
var UpdateContest = require('libs/cassandra/contestB/update');
var UpdateContestant = require('libs/cassandra/contestB/updateContestant');

var async = require('async');

var ATHLETES_INDEX = 0;
var COMMISSION_EARNED_INDEX = 1;
var DEADLINE_TIME_INDEX = 2 
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
var MAXIMUM_ENTRIES_INDEX = 14;
var MINIMUM_ENTRIES_INDEX = 15;
var PAYOUTS_INDEX = 16;
var PROCESSED_PAYOUTS_TIMESTAMP_INDEX = 17;
var SPORT_INDEX = 18;
var STARTING_VIRTUAL_MONEY_INDEX = 19;
var TOTAL_PRIZE_POOL_INDEX = 20;

var SETTINGS_LENGTH_OF_CONTEST = 21;

function verifyContestEssentials(queryResult) {
  queryResult.should.have.property(
    'athletes', 
    JSON.stringify(testContestSettings[ATHLETES_INDEX]));
  queryResult.should.have.property('commission_earned');
  queryResult.should.have.property('contest_deadline_time');
  queryResult.should.have.property('contest_end_time');
  queryResult.should.have.property(
    'contest_id', 
    testContestSettings[CONTEST_ID_INDEX]);
  queryResult.should.have.property('contest_start_time');
  queryResult.should.have.property('contest_state');
  queryResult.should.have.property('contestants');
  queryResult.should.have.property('current_entries');
  queryResult.should.have.property('entries_allowed_per_contestant');
  queryResult.should.have.property('entry_fee');
  queryResult.should.have.property('game_type');
  queryResult.should.have.property('last_locked');
  queryResult.should.have.property('lock_current_entries');
  queryResult.should.have.property('maximum_entries');
  queryResult.should.have.property('minimum_entries');
  queryResult.should.have.property('pay_outs');
  queryResult.should.have.property('processed_payouts_time');
  queryResult.should.have.property('sport');
  queryResult.should.have.property('starting_virtual_money');
  queryResult.should.have.property('total_prize_pool');
}

var contestId = testContestSettings[CONTEST_ID_INDEX];


/*
functionality to test:

 */

/**
 * ====================================================================
 * Tests for queries
 * ====================================================================
 */
//select and update
function testSelectAndUpdate(callback) {
  var selectById = function(callback) {
    SelectContest.selectById(
      testContestSettings[CONTEST_ID_INDEX], 
      function(err, result) {
        if (err) {
          callback(err);
        }
        else {
          verifyContestEssentials(result);
          callback(null);
        }
      });
  };
  /*
  var selectByUsername = function(callback) {
    SelectContest.selectByUsername(
      testContestSettings[CONTEST_ID_INDEX], 
      function(err, result) {
        if (err) {
          callback(err);
        }
        else {
          verifyContestEssentials(result);
          callback(null);
        }
      });
  };
  */
  async.waterfall(
  [

  ], callback);
}

describe('contestB', function () {
  it('should test queries then modify contestants', 
    function(done) {
      async.waterfall(
      [
      ],
        function (err) {
          (!err).should.be.true;
          done();
        });
    }
  );
});
require('test/testConfigs/takedownTest').takedown();