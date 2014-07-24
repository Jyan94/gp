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

var testUserParams2 = 
[
  20,
  'test2@test.com',
  'fbid',
  'first name',
  'image',
  'last name',
  1000,
  'password',
  'payment_info',
  10, //privilege level
  '00000000-0000-0000-0000-000000000002',
  't2',
  null,
  true,
  new Date()
];
var MONEY_INDEX = 6;
var USER_ID_INDEX = 10;
var USERNAME_INDEX = 11;

var ContestAbet = require('libs/cassandra/contestA/exports');
var UpdateBet = ContestAbet.UpdateBet;
var BetHistory = ContestAbet.BetHistory;
var Timeseries = ContestAbet.Timeseries;
var SelectBet = ContestAbet.SelectBet;
var BuyAndSellBet = ContestAbet.BuyAndSellBet;
var User = require('libs/cassandra/user');

var configs = require('config/index');
var states = configs.constants.contestAbets.STATES;

var PENDING = states.PENDING;
var ACTIVE = states.ACTIVE;
var PROCESSED = states.PROCESSED;
var EXPIRED = states.EXPIRED;

var async = require('async');
var TEST_ATHLETE_ID = '00000000-0000-0000-0000-000000000000';
var TEST_GAME_ID = '00000000-0000-0000-0000-000000000000';
var TEST_BET_ID= '3c79b8c0-12dd-11e4-9c9d-895213966459';
var TEST_EXPIRATION_TIME_MINUTES = 30;
var TEST_FANTASY_VALUE = 10;
var IS_OVER_BETTER = true;
var WAGER = 1000;

function getTestUser(testUserParams) {
  return {
    user_id: testUserParams[USER_ID_INDEX],
    username: testUserParams[USERNAME_INDEX],
    money: testUserParams[MONEY_INDEX].value
  };
}

var testInfoInsertPending = {
  athleteId: TEST_ATHLETE_ID,
  athleteName: 'TEST_NAME',
  athleteTeam: 'TEST_TEAM',
  expirationTimeMinutes: TEST_EXPIRATION_TIME_MINUTES,
  fantasyValue: TEST_FANTASY_VALUE,
  gameId: TEST_GAME_ID,
  isOverBetter: IS_OVER_BETTER,
  sport: 'TEST_SPORT',
  wager: WAGER
};

var testInfoCancelPending = {
  betId: TEST_BET_ID,
  isOverBetter: IS_OVER_BETTER,
  wager: WAGER
};

var testInfoTakePending = {
  athleteId: TEST_ATHLETE_ID,
  athleteName: 'TEST_NAME',
  athleteTeam: 'TEST_TEAM',
  betId: TEST_BET_ID,
  fantasyValue: TEST_FANTASY_VALUE,
  gameId: TEST_GAME_ID,
  overNotUnder: !IS_OVER_BETTER,
  opponent: testUserParams0[USERNAME_INDEX],
  sport: 'TEST_SPORT',
  payoff: 2 * WAGER,
  wager: WAGER
}

var testBetParams = [
  testInfoInsertPending.athleteId,
  testInfoInsertPending.athleteName,
  testInfoInsertPending.athleteTeam,
  TEST_BET_ID,
  testInfoInsertPending.expirationTimeMinutes,
  testInfoInsertPending.fantasyValue,
  testInfoInsertPending.gameId,
  testInfoInsertPending.isOverBetter,
  testInfoInsertPending.sport,
  testUserParams0[USERNAME_INDEX],
  testInfoInsertPending.wager
];

function verifyBetEssentials(queryResult) {
  queryResult.should.have.keys(
    'columns',
    'athlete_id',
    'athlete_name',
    'athlete_team',
    'bet_id',
    'bet_state',
    'bettor_usernames',
    'expirations',
    'fantasy_value',
    'game_id',
    'is_selling_position',
    'old_prices',
    'payoff',
    'prices',
    'sport');
}

function removeAll(callback) {
  async.parallel(
  [
    function(callback) {
      User.remove(testUserParams0[USER_ID_INDEX], callback);
    },
    function(callback) {
      User.remove(testUserParams1[USER_ID_INDEX], callback);
    },
    function(callback) {
      User.remove(testUserParams2[USER_ID_INDEX], callback);
    },
    function(callback) {
      UpdateBet.deleteBet(TEST_BET_ID, callback);
    },
    function(callback) {
      Timeseries.deletePrices(TEST_ATHLETE_ID, callback);
    },
    function(callback) {
      BetHistory.deleteUsingUsername(testUserParams0[USERNAME_INDEX], callback);
    },
    function(callback) {
      BetHistory.deleteUsingUsername(testUserParams1[USERNAME_INDEX], callback);
    },
    function(callback) {
      BetHistory.deleteUsingUsername(testUserParams2[USERNAME_INDEX], callback);
    }
  ], function(err) {
    callback(err);
  });
}

function setUp(callback) {
  async.waterfall(
  [
    function(callback) {
      User.insert(testUserParams0, callback);
    },
    function(callback) {
      User.insert(testUserParams1, callback);
    },
    function(callback) {
      User.insert(testUserParams2, callback);
    }
  ], callback);
}

function insertTestPending(callback) {
  UpdateBet.insertPending(
    testInfoInsertPending.athleteId,
    testInfoInsertPending.athleteName,
    testInfoInsertPending.athleteTeam,
    TEST_BET_ID,
    testInfoInsertPending.expirationTimeMinutes,
    testInfoInsertPending.fantasyValue,
    testInfoInsertPending.gameId,
    testInfoInsertPending.isOverBetter,
    testInfoInsertPending.sport,
    testUserParams0[USERNAME_INDEX],
    testInfoInsertPending.wager,
    callback);
}

function testBets(callback) {
  async.waterfall(
  [
    function(callback) {
      insertTestPending(callback);
    },
    function(callback) {
      BuyAndSellBet.cancelPending(
        testInfoCancelPending, 
        getTestUser(testUserParams0),
        callback);
    },
    function(callback) {
      insertTestPending(callback);
    },
    function(callback) {
      BuyAndSellBet.takePending(
        testInfoTakePending,
        getTestUser(testUserParams1),
        callback);
    },
    function(callback) {
      SelectBet.selectByBetId(TEST_BET_ID, function(err, result) {
        verifyBetEssentials(result);
        callback(null);
      });
    }
  ], 
  function(err) {
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
        removeAll(callback);
      },
      function(callback) {
        if (err) {
          console.trace();
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
    removeAll,
    setUp,
    testBets
  ], waterfallCallback);
}

describe('contest A bets', function () {
  it('should test queries for bets', function(done) {
    tests(function () {
      done();
    }); 
  });
});