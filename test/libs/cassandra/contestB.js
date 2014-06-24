/**
 * ====================================================================
 * Author: Harrison Zhao
 * ====================================================================
 */
'use strict';
(require('rootpath')());

var setupTest = require('test/testConfigs/setupTest');
var testConfigs = require('test/testConfigs/testConfigs');
var testUserParams0 = testConfigs.testUserParams[0];
var testUserParams1 = testConfigs.testUserParams[1];
var testContestSettings = testConfigs.testContestSettings[0];
console.log(testContestSettings);
var USER_ID_INDEX = 0;
setupTest.setup();

var AddContestant = require('libs/cassandra/contestB/addContestant');
var Lock = require('libs/cassandra/contestB/lock');
var RemoveContestant = require('libs/cassandra/contestB/RemoveContestant');
var SelectContest = require('libs/cassandra/contestB/select');
var UpdateContest = require('libs/cassandra/contestB/update');
var UpdateContestant = require('libs/cassandra/contestB/updateContestant');
var User = require('libs/cassandra/user');

var configs = require('config/index');
var cql = configs.cassandra.cql;
var states = configs.constants.contestB;

var OPEN = states.OPEN;
var FILLED = states.FILLED;
var TO_PROCESS = states.TO_PROCESS;
var PROCESSED = states.PROCESSED;
var CANCELLED = states.CANCELLED;

var async = require('async');

var ATHLETES_INDEX = 0;
var CONTEST_ID_INDEX = 4;
var CONTESTID = testContestSettings[CONTEST_ID_INDEX];

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
 * add contestant
 * select by username
 * insert test instances for contestant and not existing username
 * remove instances
 * test lock
 */

var selectById = function(callback) {
  SelectContest.selectById(
    CONTESTID, 
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

var testStates = function(callback) {
  async.waterfall(
  [
    function(callback) {
      UpdateContestant.setFilled(CONTESTID, callback);
    },
    function(callback) {
      SelectContest.selectFilled(CONTESTID, function(err, result) {
        if (err) {
          callback(err);
        }
        else {
          verifyContestEssentials(result);
          result.should.have.property('contest_state', FILLED);
          callback(null);
        }
      });
    },
    function(callback) {
      UpdateContestant.setToProcess(CONTESTID, callback);
    },
    function(callback) {
      SelectContest.selectContestsToProcess(CONTESTID, function(err, result) {
        if (err) {
          callback(err);
        }
        else {
          verifyContestEssentials(result);
          result.should.have.property('contest_state', TO_PROCESS);
          callback(null);
        }
      });
    },
    function(callback) {
      UpdateContestant.setProcessed(CONTESTID, callback);
    },
    function(callback) {
      SelectContest.selectProcessed(CONTESTID, function(err, result) {
        if (err) {
          callback(err);
        }
        else {
          verifyContestEssentials(result);
          result.should.have.property('contest_state', PROCESSED);
          callback(null);
        }
      });
    },
    function(callback) {
      UpdateContestant.setCancelled(CONTESTID, callback);
    },
    function(callback) {
      SelectContest.selectCancelled(CONTESTID, function(err, result) {
        if (err) {
          callback(err);
        }
        else {
          verifyContestEssentials(result);
          result.should.have.property('contest_state', CANCELLED);
          callback(null);
        }
      });
    },    
    function(callback) {
      UpdateContestant.setOpen(CONTESTID, callback);
    },
    function(callback) {
      SelectContest.selectFilled(CONTESTID, function(err, result) {
        if (err) {
          callback(err);
        }
        else {
          verifyContestEssentials(result);
          result.should.have.property('contest_state', OPEN);
          callback(null);
        }
      });
    }
  ], callback);
}

function testContestant(callback) {
  var user0 = null;
  var user1 = null;
  var contest = null;
  var numContestants = 0;
  var numInstances0 = 0;
  var numInstances1 = 0;
  async.waterfall(
  [
    function(callback) {
      User.select(
        ['user_id'], 
        [testUserParams0[USER_ID_INDEX]], 
        function (err, result) {
          if (err) {
            callback(err);
          }
          else {
            user0 = result;
            callback(null);
          }
        });
    },
    function(callback) {
      User.select(
        ['user_id'], 
        [testUserParams1[USER_ID_INDEX]], 
        function (err, result) {
          if (err) {
            callback(err);
          }
          else {
            user1 = result;
            callback(null);
          }
        });
    },
    function(callback) {
      selectById(CONTESTID, function(err, result) {
        if (err) {
          callback(err);
        }
        else {
          contest = result;
          callback(null);
        }
      });
    },
    function(callback) {
      ++numInstances0;
      ++numContestants;
      AddContestant.addContestant(user0, contest.contest_id, callback);
    },
    function(callback) {
      selectById(CONTESTID, function(err, result) {
        if (err) {
          callback(err);
        }
        else {
          result.contestants.should.have.property(user0.username);
          JSON.parse(result.contestants[user0.username])
            .should.have.length(numInstances0);
          JSON.parse(result.contestants[user0.username])[0]
            .should.have.keys('wagers', 'predictions', 'virtualMoneyRemaining')
          callback(null);
        }
      });
    },
    function(callback) {
      ++numInstances0;
      AddContestant.addContestant(user0, contest.contest_id, callback);
    },
    function(callback) {
      selectById(CONTESTID, function(err, result) {
        if (err) {
          callback(err);
        }
        else {
          result.contestants.should.have.property(user0.username);
          JSON.parse(result.contestants[user0.username])
            .should.have.length(numInstances0);
          Object.keys(result.contestants).should.have.length(numContestants);
          callback(null);
        }
      });
    },
    function(callback) {
      ++numInstances1;
      ++numContestants;
      AddContestant.addContestant(user1, contest.contest_id, callback);
    },
    function(callback) {
      selectById(CONTESTID, function(err, result) {
        if (err) {
          callback(err);
        }
        else {
          //maximum_entries is 3
          result.maximum_entries.should.equal(numInstances0 + numInstances1);
          result.contestants.should.have.property(user0.username);
          Object.keys(result.contestants).should.have.length(numContestants);
          callback(null);
        }
      });
    },
    function(callback) {
      --numInstances0;
      RemoveContestant.removeContestantInstance(user0, 1, CONTESTID, callback);
    },
    function(callback) {
      selectById(CONTESTID, function(err, result) {
        if (err) {
          callback(err);
        }
        else {
          result.contestants.should.have.property(user0.username);
          JSON.parse(result.contestants[user0.username])
            .should.have.length(numInstances0);
          callback(null);
        }
      });
    },
    function(callback) {
      --numInstances0;
      RemoveContestant.removeContestantInstance(user0, 1, CONTESTID, callback);
    },
    function(callback) {
      selectById(CONTESTID, function(err, result) {
        if (err) {
          callback(err);
        }
        else {
          result.contestants.should.have.property(user0.username);
          JSON.parse(result.contestants[user0.username])
            .should.have.length(numInstances0);
          callback(null);
        }
      });
    },
    function(callback) {
      --numInstances0;
      --numContestants;
      numInstances0.should.be(0);
      RemoveContestant.removeContestantInstance(user0, 0, CONTESTID, callback);
    },
    function(callback) {
      selectById(CONTESTID, function(err, result) {
        if (err) {
          callback(err);
        }
        else {
          result.contestants.should.not.have.property(user0.username);
          Object.keys(result.contestants).should.have.length(numContestants);
          callback(null);
        }
      });
    },
    function(callback) {
      --numInstances1;
      --numContestants;
      numInstances1.should.be(0);
      RemoveContestant.removeContestantInstance(user0, 0, CONTESTID, callback);
    },
    function(callback) {
      selectById(CONTESTID, function(err, result) {
        if (err) {
          callback(err);
        }
        else {
          result.contestants.should.not.have.property(user1.username);
          Object.keys(result.contestants).should.have.length(numContestants);
          callback(null);
        }
      });
    },
    function(callback) {
      UpdateContest.delete(CONTESTID, callback);
    },
    function(callback) {
      selectById(CONTESTID, function(err, result) {
        if (err) {
          callback(err);
        }
        else if (!result){
          callback(null);
        }
        else {
          callback(err);
        }
      });
    }
  ], callback);
}

function tests(callback) {
  async.waterfall(
  [
    testStates,
    testContestant
  ], callback);
}

describe('contestB', function () {
  it('should test queries then modify contestants', function(done) {
    tests(function (err) {
      (!err).should.be.true;
      done();
    }); 
  });
});
require('test/testConfigs/takedownTest').takedown();