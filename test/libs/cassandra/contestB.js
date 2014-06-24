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
var CONTEST_ID_INDEX = 4;
var contestId = testContestSettings[CONTEST_ID_INDEX];

function verifyContestEssentials(queryResult) {
  queryResult.should.have.property(
    'athletes', 
    JSON.stringify(testContestSettings[ATHLETES_INDEX]));
  queryResult.should.have.property(
    'contest_id', 
    testContestSettings[CONTEST_ID_INDEX]);
  queryResult.should.have.keys(
    'athletes', 
    'commission_earned', 
    'contest_deadline_time',
    'contest_id',
    'contest_start_time',
    'contest_state',
    'contestants',
    'current_entries',
    'entries_allowed_per_contestant',
    'entry_fee',
    'game_type',
    'last_locked',
    'lock_current_entries',
    'max_wager',
    'maximum_entries',
    'minimum_entries',
    'pay_outs',
    'processed_payouts_time',
    'sport',
    'starting_virtual_money',
    'total_prize_pool');
}

/**
 * functionality to test:
 * select by id, username
 * select by state, set state
 */

/**
 * ====================================================================
 * Tests for queries
 * ====================================================================
 */
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