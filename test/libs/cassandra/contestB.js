/**
 * ====================================================================
 * Author: Harrison Zhao
 * ====================================================================
 * Note: inserting into the daily_prophet table modifies the testContestSettings
 */
'use strict';
(require('rootpath')());

var testUserParams0 =
[
  20, //age
  'test0@test.com', //email
  'fbid', //facebook_id
  'first name', //first_name
  'image', //image
  'last name',  //last_name
  2000, //money
  'password', //password
  'payment_info', //payment_info
  10, //privilege level
  '00000000-0000-0000-0000-000000000000', //user_id
  'T0', //t0
  null, //verification_code
  true, //verified
  new Date()  //verified_time
];

var testUserParams1 = 
[
  20,
  'test1@test.com',
  'fbid',
  'first name',
  'image',
  'last name',
  1000,
  'password',
  'payment_info',
  10, //privilege level
  '00000000-0000-0000-0000-000000000001',
  'T1',
  null,
  true,
  new Date()
];

/*
example athletes object
{
  athleteName: 'John Snow',
  athleteId: '00000000-0000-0000-0000-000000000000',
  gameContestId: 0,
  gameId: '00000000-0000-0000-0000-000000000000',
  isOnHomeTeam: true,
  position: 'test_pitcher',
  shortTeamName: 'TEST_GOT',
  longTeamName: 'THE_TEST_GOT',
  teamId: '00000000-0000-0000-0000-000000000000'
};

example games object
{
  awayTeam: 'TEST_A',
  awayTeamId: '00000000-0000-0000-0000-000000000000',
  gameDate: (new Date()).getTime(),
  gameId: '00000000-0000-0000-0000-000000000000',
  homeTeam: 'TEST_B',
  homeTeamId: '00000000-0000-0000-0000-000000000001',
}
 */

var testContestSettings =
[
  ['John Snow00', 'John Snow01', 'John Snow02', 'John Snow03', 'John Snow04'],
  //athlete_names
  [
    '{"athleteName":"John Snow00",' +
       '"athleteId":"00000000-0000-0000-0000-000000000000",' +
       '"gameContestId":0,"gameId":"00000000-0000-0000-0000-000000000000",' +
       '"longTeamName":"THE_TEST_GOT", ' +
       '"longVersusTeamName": "VERSUS_LONG_TEST", ' +
       '"isOnHomeTeam":true,' + 
       '"position":"test_pitcher",' +
       '"shortTeamName":"TEST_GOT",' + 
       '"shortVersusTeamName": "VERSUS_TEST", ' +
       '"teamId":"00000000-0000-0000-0000-000000000000"}',
    '{"athleteName":"John Snow01",' +
       '"athleteId":"00000000-0000-0000-0000-000000000001",' +
       '"gameContestId":0,"gameId":"00000000-0000-0000-0000-000000000000",' +
       '"longTeamName":"THE_TEST_GOT", ' +
       '"longVersusTeamName": "VERSUS_LONG_TEST", ' +
       '"isOnHomeTeam":true,' + 
       '"position":"test_pitcher",' +
       '"shortTeamName":"TEST_GOT",' + 
       '"shortVersusTeamName": "VERSUS_TEST", ' +
       '"teamId":"00000000-0000-0000-0000-000000000000"}',
    '{"athleteName":"John Snow02",' +
       '"athleteId":"00000000-0000-0000-0000-000000000002",' +
       '"gameContestId":0,"gameId":"00000000-0000-0000-0000-000000000000",' +
       '"longTeamName":"THE_TEST_GOT", ' +
       '"longVersusTeamName": "VERSUS_LONG_TEST", ' +
       '"isOnHomeTeam":true,' + 
       '"position":"test_pitcher",' +
       '"shortTeamName":"TEST_GOT",' + 
       '"shortVersusTeamName": "VERSUS_TEST", ' +
       '"teamId":"00000000-0000-0000-0000-000000000000"}',
    '{"athleteName":"John Snow03",' +
       '"athleteId":"00000000-0000-0000-0000-000000000003",' +
       '"gameContestId":0,"gameId":"00000000-0000-0000-0000-000000000000",' +
       '"longTeamName":"THE_TEST_GOT", ' +
       '"longVersusTeamName": "VERSUS_LONG_TEST", ' +
       '"isOnHomeTeam":true,' + 
       '"position":"test_pitcher",' +
       '"shortTeamName":"TEST_GOT",' + 
       '"shortVersusTeamName": "VERSUS_TEST", ' +
       '"teamId":"00000000-0000-0000-0000-000000000000"}',
    '{"athleteName":"John Snow04",' +
       '"athleteId":"00000000-0000-0000-0000-000000000004",' +
       '"gameContestId":0,"gameId":"00000000-0000-0000-0000-000000000000",' +
       '"longTeamName":"THE_TEST_GOT", ' +
       '"longVersusTeamName": "VERSUS_LONG_TEST", ' +
       '"isOnHomeTeam":true,' + 
       '"position":"test_pitcher",' +
       '"shortTeamName":"TEST_GOT",' + 
       '"shortVersusTeamName": "VERSUS_TEST", ' +
       '"teamId":"00000000-0000-0000-0000-000000000000"}'
  ], //athletes
  0,  //commission_earned
  new Date(new Date().getTime() + 100000), //contest_deadline_time
  null, //contest_end_time
  'bcf4d500-fe44-11e3-89b7-c361d0a10fc1', //contest_id
  'THE_DAILY_PROPHET',
  new Date(), //contest_start_time
  0,  //contest_state
  {}, //contestants
  0, //cooldown_minutes
  0, //current_entries
  2, //entries_allowed_per_contestant
  1000, //entry_fee
  [    '{"awayTeam":"TEST_A",' +
       '"awayTeamId":"00000000-0000-0000-0000-000000000000",' +
       '"gameDate":1403899335204,' +
       '"gameId":"00000000-0000-0000-0000-000000000000",' +
       '"homeTeam":"TEST_B",' +
       '"homeTeamId":"00000000-0000-0000-0000-000000000001"}'
  ],  //games
  false, //isfiftyfifty
  8000,   //max_wager
  3, //maximum_entries
  1, //minimum_entries
  [1.0, 10.0, 11.0, 12.0, 13.0], //payouts
  null, //processed_payouts_timestamp
  'TEST_SPORT',  //sport
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
  virtualMoneyRemaining: 0,
  wagers: [2000, 2000, 3000, 1000, 2000],
  predictions: [10, 20, 30, 40, 50],
  joinTime: new Date()
};
var testInstance2 = {
  virtualMoneyRemaining: 0,
  wagers: [2000, 2000, 2000, 2000, 2000],
  predictions: [10, 20, 30, 40, 40],
  joinTime: new Date()
};
var USER_ID_INDEX = 10;

var AddContestant = require('libs/cassandra/contestB/addContestant');
var RemoveContestant = require('libs/cassandra/contestB/removeContestant');
var SelectContest = require('libs/cassandra/contestB/select');
var UpdateContest = require('libs/cassandra/contestB/update');
var UpdateContestant = require('libs/cassandra/contestB/updateContestant');
var TimeseriesValues = require('libs/cassandra/contestB/timeseries');
var User = require('libs/cassandra/user');
var AddAndUpdateContestant = 
  require('libs/cassandra/contestB/addAndUpdateContestant');

var configs = require('config/index');
var states = configs.constants.contestB.STATES;

var OPEN = states.OPEN;
var FILLED = states.FILLED;
var TO_PROCESS = states.TO_PROCESS;
var PROCESSED = states.PROCESSED;
var CANCELLED = states.CANCELLED;

var async = require('async');

var CONTEST_ATHLETES_IDS_INDEX = 1;
var CONTEST_ID_INDEX = 5;
var CONTEST_GAMES_INDEX = 14;
var CONTESTID = testContestSettings[CONTEST_ID_INDEX];

function verifyContestEssentials(queryResult) {
  queryResult.should.have.property(
    'athletes',
    testContestSettings[CONTEST_ATHLETES_IDS_INDEX].value);
  queryResult.should.have.property(
    'contest_id', 
    testContestSettings[CONTEST_ID_INDEX]);
  queryResult.should.have.property(
    'games',
    testContestSettings[CONTEST_GAMES_INDEX].value);
  queryResult.should.have.keys(
    'columns',
    'athlete_names',
    'athletes', 
    'commission_earned', 
    'contest_deadline_time',
    'contest_end_time',
    'contest_id',
    'contest_name',
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
    'payouts',
    'processed_payouts_time',
    'sport',
    'starting_virtual_money',
    'total_prize_pool');
}

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
      UpdateContest.delete(CONTESTID, function(err) {
        callback(err);
      });
    },
    function(callback) {
      User.remove(testUserParams0[USER_ID_INDEX], callback);
    },
    function(callback) {
      User.remove(testUserParams1[USER_ID_INDEX], callback);
    },
    function(callback) {
      User.insert(testUserParams0, callback);
    },
    function(callback) {
      User.insert(testUserParams1, callback);
    },
    function(callback) {
      UpdateContest.insert(testContestSettings, function(err) {
        if (err) {
          console.log(err);
        }
        (err === null).should.be.true;
        callback(err);
      });
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
      User.selectById(
        testUserParams0[USER_ID_INDEX], 
        function (err, result) {
          if (err) {
            (err === null).should.be.true;
            callback(err);
          }
          else {
            user0 = result;
            callback(null);
          }
        });
    },
    function(callback) {
      User.selectById(
        testUserParams1[USER_ID_INDEX], 
        function (err, result) {
          if (err) {
            (err === null).should.be.true;
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
          (err === null).should.be.true;
          callback(err);
        }
        else {
          contest = result;
          callback(null);
        }
      });
    },
    function(callback) {
      SelectContest.selectOpenByAthlete(
        testContestSettings[0].value[0], 
        function(err, results){
          if (err) {
            console.log(err);
            (err === null).should.be.true;
          }
          else {
            results[0].athlete_names.
              should.have.length(testContestSettings[0].value.length);
            callback(null);
          }
        });
    },
    function(callback) {
      ++numInstances0;
      ++numContestants;
      AddContestant.addContestant(
        user0, 
        contest.contest_id, 
        function(err, result) {
          if (err) {
            console.log(err);
          }
          (err === null).should.be.true;
          result.should.equal(numInstances0 - 1);
          callback(null);
        }
      );
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
            'lastModified',
            'joinTime');
        callback(null);
      });
    },
    function(callback) {
      SelectContest.selectByUsername(user0.username, function(err, result) {
        result = result[0];
        (err === null).should.be.true;
        result.contestants.should.have.property(user0.username);
        JSON.parse(result.contestants[user0.username]).instances
          .should.have.length(numInstances0);
        JSON.parse(result.contestants[user0.username]).instances[0]
          .should.have.keys(
            'wagers', 
            'predictions', 
            'virtualMoneyRemaining',
            'lastModified',
            'joinTime');
        callback(null);
      });
    },
    function(callback) {
      UpdateContestant.updateContestantInstance(
        user0, 0, testInstance, CONTESTID, function(err) {
          if (err) {
            console.log(err);
          }
          (err === null).should.be.true;
          callback(err);
        });
    },
    function(callback) {
      User.selectById(
        testUserParams0[USER_ID_INDEX], 
        function (err, result) {
          if (err) {
            (err === null).should.be.true;
            callback(err);
          }
          else {
            user0 = result;
            user0.money.should.equal(1000);
            callback(null);
          }
        });
    },
    function(callback) {
      //console.log('2');
      selectById(function(err, result) {
        (err === null).should.be.true;
        var contestant = JSON.parse(result.contestants[user0.username]);
        contestant.instances.should.have.length(numInstances0);
        contestant.instances[0].should.have.keys(
          'wagers', 
          'predictions', 
          'virtualMoneyRemaining',
          'lastModified',
          'joinTime');
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
      RemoveContestant.removeContestantInstance(user0, 0, CONTESTID, callback);
    },
    function(callback) {
      AddAndUpdateContestant.addAndUpdateContestant(
        user0, CONTESTID, testInstance, function(err) {
          if (err) {
            console.log(err);
          }
          (err === null).should.be.true;
          callback(null);
        });
    },
    function(callback) {
      //console.log('2');
      selectById(function(err, result) {
        (err === null).should.be.true;
        var contestant = JSON.parse(result.contestants[user0.username]);
        contestant.instances.should.have.length(numInstances0);
        contestant.instances[0].should.have.keys(
          'wagers', 
          'predictions', 
          'virtualMoneyRemaining',
          'lastModified',
          'joinTime');
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
      //console.log('3');
      ++numInstances0;
      AddContestant.addContestant(
        user0, 
        contest.contest_id, 
        function(err, result) {
          (err === null).should.be.true;
          result.should.equal(numInstances0 - 1);
          callback(null);
        });
    },
    function(callback) {
      //console.log('4');
      selectById(function(err, result) {
        if (err) {
          (err === null).should.be.true;
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
      RemoveContestant.removeContestantInstance(user0, 0, CONTESTID, callback);
    },
    function(callback) {
      AddAndUpdateContestant.addAndUpdateContestant(
        user0, CONTESTID, testInstance2, callback);
    },
    function(callback) {
      selectById(function(err, result) {
        (err === null).should.be.true;
        var contestant = JSON.parse(result.contestants[user0.username]);
        contestant.instances.should.have.length(numInstances0);
        contestant.instances[1].should.have.keys(
          'wagers', 
          'predictions', 
          'virtualMoneyRemaining',
          'lastModified',
          'joinTime');
        contestant.instances[1].should.have.property(
          'wagers', testInstance2.wagers);
        contestant.instances[1].should.have.property(
          'predictions', testInstance2.predictions);
        contestant.instances[1].should.have.property(
          'virtualMoneyRemaining', testInstance2.virtualMoneyRemaining);
        callback(null);
      }); 
    },
    function(callback) {
      //console.log('5');
      ++numInstances1;
      ++numContestants;
      AddContestant.addContestant(
        user1, 
        contest.contest_id,
        function(err, result) {
          (err === null).should.be.true;
          result.should.equal(numInstances1 - 1);
          callback(null);
        });
    },
    function(callback) {
      selectById(function(err, result) {
        if (err) {
          (err === null).should.be.true;
          callback(err);
        }
        else {
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
          (err === null).should.be.true;
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
      //console.log('6');
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
          callback(err);
        }
        else {
          (result.contestants === null).should.be.true;
          callback(null);
        }
      });
    }
  ], function(err) {
    if (err) {
      callback(err);
    }
    else {
      callback(null);      
    }
  });
}

function tests(callback) {
  var waterfallCallback = function(err) {
    if (err) {
      console.log(err);
      console.log(err.stack);
      console.trace();
    }
    async.waterfall([
      function(callback) {
        UpdateContest.delete(CONTESTID, function(err) {
          callback(err);
        });
      },
      function(callback) {
        async.each(athleteIds, function(athleteId, callback){
          TimeseriesValues.removeValues(athleteId, callback);
        }, callback);
      },
      function(callback) {
        User.remove(testUserParams0[USER_ID_INDEX], callback);
      },
      function(callback) {
        User.remove(testUserParams1[USER_ID_INDEX], callback);
      },
      function(callback) {
        if (err) {
          (err === null).should.be.true;
        }
        else {
          callback(null);
        }
      }
    ], callback);
  };
  async.waterfall(
  [
    testStates,
    testContestant
  ], waterfallCallback);
}

describe('dailyProphet', function () {
  it('should test queries then modify contestants', function(done) {
    tests(function () {
      done();
    }); 
  });
});