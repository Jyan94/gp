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
    0: '{"athleteId":"00000000-0000-0000-0000-000000000000",'+
       '"athleteName":"John Snow0"}',
    1: '{"athleteId":"00000000-0000-0000-0000-000000000001",' +
        '"athleteName":"John Snow1"}',
    2: '{"athleteId":"00000000-0000-0000-0000-000000000002",' +
        '"athleteName":"John Snow2"}',
    3: '{"athleteId":"00000000-0000-0000-0000-000000000003",' +
        '"athleteName":"John Snow3"}',
    4: '{"athleteId":"00000000-0000-0000-0000-000000000004",' +
        '"athleteName":"John Snow4"}'
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
  {value: [
    '00000000-0000-0000-0000-000000000000', 
    '00000000-0000-0000-0000-000000000001'
  ], hint: 'list'},  //games
  false, //isfiftyfifty
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

var athleteIds = 
[
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000004'

];

var testInstance = {
  virtualMoneyRemaining: 1000,
  wagers: [2000, 2000, 3000, 1000, 1000],
  predictions: [10, 20, 30, 40, 50]
};
var CONTEST_ATHLETES_IDS_INDEX = 0;
var USER_ID_INDEX = 0;

var AddContestant = require('libs/cassandra/contestB/addContestant');
var RemoveContestant = require('libs/cassandra/contestB/removeContestant');
var SelectContest = require('libs/cassandra/contestB/select');
var UpdateContest = require('libs/cassandra/contestB/update');
var UpdateContestant = require('libs/cassandra/contestB/updateContestant');
var TimeseriesValues = require('libs/cassandra/contestB/timeseries');
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
    'games',
    'isfiftyfifty',
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
        (err === null).should.be.true;
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
      });
    },
    function(callback) {
      UpdateContestant.updateContestantInstance(
        user0, 0, testInstance, CONTESTID, function(err) {
          callback(err);
        });
    },
    function(callback) {
      selectById(function(err, result) {
        (err === null).should.be.true;
        var contestant = JSON.parse(result.contestants[user0.username]);
        contestant.instances.should.have.length(numInstances0);
        contestant.instances[0].should.have.keys(
          'wagers', 
          'predictions', 
          'virtualMoneyRemaining',
          'lastModified');
        contestant.instances[0].should.have.property(
          'wagers', testInstance.wagers);
        contestant.instances[0].should.have.property(
          'predictions', testInstance.predictions);
        contestant.instances[0].should.have.property(
          'virtualMoneyRemaining', testInstance.virtualMoneyRemaining);
        callback(null);
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
          callback(null);
        }
      });
    }
  ], callback);
}

function tests(callback) {
  var waterfallCallback = function(err) {
    async.waterfall([
      function(callback) {
        UpdateContest.delete(CONTESTID, function(err) {
          callback(err);
        });
      },
      function(callback) {
        async.each(athleteIds, function(athleteId, callback){
          TimeseriesValues.removeValue(athleteId, callback);
        }, callback);
      }
    ], callback);
  };
  async.waterfall(
  [
    testStates,
    testContestant
  ], waterfallCallback);
}

describe('contestB', function () {
  it('should test queries then modify contestants', function(done) {
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