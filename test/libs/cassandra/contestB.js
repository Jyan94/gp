/**
 * ====================================================================
 * Author: Harrison Zhao
 * ====================================================================
 */
'use strict';
(require('rootpath')());

var setupTest = require('test/testConfigs/setupTest');
var cql = require('config/index').cassandra.cql;
var testUserParams0 = 
[
  '00000000-0000-0000-0000-000000000000',
  'test0@test.com',
  true,
  new Date(),
  'hello0',
  'world',
  'first name',
  'last name',
  20,
  'address',
  'paymentinfo',
  {value: 1000, hint: 'double'},
  {value: 1000, hint: 'double'},
  'fbid',
  0,
  'image'
];

var testUserParams1 = 
[
  '00000000-0000-0000-0000-000000000001',
  'test1@test.com',
  true,
  new Date(),
  'hello1',
  'world',
  'first name',
  'last name',
  20,
  'address',
  'paymentinfo',
  {value: 1000, hint: 'double'},
  {value: 1000, hint: 'double'},
  'fbid',
  0,
  'image'
];

var testContestSettings =
[
  {value: {
    0: 'a',
    1: 'b',
    2: 'c',
    3: 'd',
    4: '5'
  }, hint: 'map'}, //athletes
  0,  //commission_earned
  null, //contest_deadline_time
  null, //contest_end_time
  '00000000-0000-0000-0000-000000000000', //contest_id
  new Date(), //contest_start_time
  0,  //contest_state
  {value: {}, hint: 'map'}, //contestants
  0, //cooldown_minutes
  0, //current_entries
  2, //entries_allowed_per_contestant
  1000, //entry_fee
  'daily prophet', //game_type
  8000,   //max_wager
  3, //maximum_entries
  1, //minimum_entries
  {value: {
    0: {value: 1.0, hint: 'double'},
    1: {value: 10.0, hint: 'double'},
    2: {value: 11.0, hint: 'double'},
    3: {value: 12.0, hint: 'double'},
    4: {value: 13.0, hint: 'double'}
  }, hint: 'map'},  //pay_outs
  null, //processed_payouts_timestamp
  'world',  //sport
  10000, //starting_virtual_money
  10  //total_prize_pool
];
var USER_ID_INDEX = 0;

var AddContestant = require('libs/cassandra/contestB/addContestant');
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
  queryResult.should.have.property('athletes');
  queryResult.should.have.property(
    'contest_id', 
    testContestSettings[CONTEST_ID_INDEX]);
  queryResult.should.have.keys(
    'columns',
    'athletes', 
    'commission_earned', 
    'contest_deadline_time',
    'contest_end_time',
    'contest_id',
    'contest_start_time',
    'contest_state',
    'contestants',
    'cooldown_minutes',
    'current_entries',
    'entries_allowed_per_contestant',
    'entry_fee',
    'game_type',
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
        callback(null, result);
      }
    });
};

var testStates = function(callback) {
  async.waterfall(
  [
    function(callback) {
      User.insert(testUserParams0, callback);
    },
    function(callback) {
      User.insert(testUserParams1, callback);
    },
    function(callback) {
      UpdateContest.insert(testContestSettings, callback);
    },
    function(callback) {
      UpdateContest.setFilled(CONTESTID, callback);
    },
    function(callback) {
      SelectContest.selectById(CONTESTID, function(err, result) {
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
      UpdateContest.setToProcess(CONTESTID, callback);
    },
    function(callback) {
      SelectContest.selectById(CONTESTID, function(err, result) {
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
      UpdateContest.setProcessed(CONTESTID, callback);
    },
    function(callback) {
      SelectContest.selectById(CONTESTID, function(err, result) {
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
      UpdateContest.setCancelled(CONTESTID, callback);
    },
    function(callback) {
      SelectContest.selectById(CONTESTID, function(err, result) {
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
      UpdateContest.setOpen(CONTESTID, callback);
    },
    function(callback) {
      SelectContest.selectById(CONTESTID, function(err, result) {
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
        'user_id', 
        testUserParams0[USER_ID_INDEX], 
        function (err, result) {
          if (err) {
            (!err).should.be.true;
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
        'user_id', 
        testUserParams1[USER_ID_INDEX], 
        function (err, result) {
          if (err) {
            err.should.be.false;
            callback(err);
          }
          else {
            user1 = result;
            callback(null);
          }
        });
    },
    function(callback) {
      selectById(function(err, result) {
        if (err) {
          err.should.be.false;
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
      selectById(function(err, result) {
        if (err) {
          err.should.be.false;
          callback(err);
        }
        else {
          result.contestants.should.have.property(user0.username);
          JSON.parse(result.contestants[user0.username]).instances
            .should.have.length(numInstances0);
          JSON.parse(result.contestants[user0.username]).instances[0]
            .should.have.keys(
              'wagers', 
              'predictions', 
              'virtualMoneyRemaining',
              'lastModified');
          callback(null);
        }
      });
    },
    function(callback) {
      ++numInstances0;
      AddContestant.addContestant(user0, contest.contest_id, callback);
    },
    function(callback) {
      selectById(function(err, result) {
        if (err) {
          err.should.be.false;
          callback(err);
        }
        else {
          result.contestants.should.have.property(user0.username);
          JSON.parse(result.contestants[user0.username]).instances
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
      selectById(function(err, result) {
        if (err) {
          err.should.be.false;
          callback(err);
        }
        else {
          //maximum_entries is 3
          //result.maximum_entries.should.equal(numInstances0 + numInstances1);
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
      selectById(function(err, result) {
        if (err) {
          err.should.be.false;
          callback(err);
        }
        else {
          result.contestants.should.have.property(user0.username);
          JSON.parse(result.contestants[user0.username]).instances
            .should.have.length(numInstances0);
          callback(null);
        }
      });
    },
    function(callback) {
      --numInstances0;
      --numContestants;
      numInstances0.should.equal(0);
      RemoveContestant.removeContestantInstance(user0, 0, CONTESTID, callback);
    },
    function(callback) {
      selectById(function(err, result) {
        if (err) {
          err.should.be.false;
          callback(err);
        }
        else {
          result.contestants.should.not.have.property(user0.username);
          JSON.parse(result.contestants[user1.username]).instances
            .should.have.length(numInstances1);
          callback(null);
        }
      });
    },
    function(callback) {
      --numInstances1;
      --numContestants;
      numInstances1.should.equal(0);
      RemoveContestant.removeContestantInstance(user1, 0, CONTESTID, callback);
    },
    function(callback) {
      selectById(function(err, result) {
        if (err) {
          err.should.be.false;
          callback(err);
        }
        else {
          (result.contestants === null).should.be.true;
          //Object.keys(result.contestants).should.have.length(numContestants);
          callback(null);
        }
      });
    },
    function(callback) {
      UpdateContest.delete(CONTESTID, callback);
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
    this.timeout(1000000);
    tests(function (err) {
      if(err) {
        console.log(err);
        console.log(err.stack);
        console.trace();
        err.should.be.false;
      }
      done();
    }); 
  });
});
require('test/testConfigs/takedownTest').takedown();