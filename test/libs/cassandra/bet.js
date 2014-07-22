/*'use strict';
require('rootpath')();

var async = require('async');
var Bet = require('libs/cassandra/bet');
var BETIDFIRST = '10cf667c-24e2-11df-8924-001ff3591711';
var BETIDSECOND = '10cf667c-24e2-11df-8924-001ff3591712';
var USERIDFIRST = '12000000-0000-0000-0000-000000005eb3';
var USERIDSECOND = '12000000-0000-0000-0000-000000005eb4';
var USERIDTHIRD = '12000000-0000-0000-0000-000000005eb5';
var PLAYERID = '00000000-0000-0000-0000-000000000001';
var betIdIndex = 0
var userIdIndex = 1;
var OVERPositionIndex = 2;
var athleteIdIndex = 3;
var betValueIndex = 4;
var multiplierIndex = 5;
var gameIdIndex = 6;
var expirationIndex = 7;

function testDelete(callback) {
  Bet.delete('current_bets', BETIDFIRST,
    function (err, result) {
      if (err) {
        callback(err);
      }
      Bet.delete('current_bets', BETIDSECOND,
        function (err, result) {
          if (err) {
            callback(err);
          }
          callback(null);
        });
    });
}

var pendingFields =
[
'bet_id',
'user_id',
'OVER_position',
'athlete_id',
'bet_value',
'multiplier',
'game_id',
'expiration'
]

var pendingParamsFirst =
[
BETIDFIRST, //bet_id
USERIDFIRST, //user_id
true, //OVER_position
PLAYERID, //athlete_id
{ value: 100, hint: 'double' }, //bet_value
{ value: 10, hint: 'double' }, // multiplier
'10000000-0000-0000-0000-000000000001', //game_id
'10cf667c-24e2-11df-8924-001ff3591715' //expiration
]

var pendingParamsSecond =
[
BETIDSECOND, //bet_id
USERIDSECOND, //user_id
false, //OVER_position
PLAYERID, //athlete_id
{ value: 200, hint: 'double' }, //bet_value
{ value: 3, hint: 'double' }, // multiplier
'10000000-0000-0000-0000-000000000001', //game_id
'10cf667c-24e2-11df-8924-001ff3591716' //expiration
]
function testInsertPending(callback) {
  Bet.insertPending(pendingParamsFirst,
    function (err) {
        if (err) {
          callback(err);
        }
        Bet.insertPending(pendingParamsSecond,
          function (err) {
            if (err) {
              callback(err);
            }
            callback(null);
          });
      });
}

var currentFields =
[
'bet_id',
'OVER_better_id',
'UNDER_better_id',
'athlete_id',
'bet_value',
'multiplier',
'game_id',
'expiration'
]

var currentParamsFirst =
[
BETIDFIRST, //bet_id
USERIDFIRST, //user_id
USERIDSECOND, //OVER_position
PLAYERID, //athlete_id
{ value: 100, hint: 'double' }, //bet_value
{ value: 10, hint: 'double' }, // multiplier
'10000000-0000-0000-0000-000000000001', //game_id
'10cf667c-24e2-11df-8924-001ff3591715' //expiration
]

var currentParamsSecond =
[
BETIDSECOND, //bet_id
USERIDTHIRD, //user_id
USERIDSECOND, //OVER_position
PLAYERID, //athlete_id
{ value: 200, hint: 'double' }, //bet_value
{ value: 3, hint: 'double' }, // multiplier
'10000000-0000-0000-0000-000000000001', //game_id
'10cf667c-24e2-11df-8924-001ff3591716' //expiration
]
function testInsertCurrent(callback) {
  Bet.insertCurrent(USERIDSECOND, currentParamsFirst,
    function (err) {
      if (err) {
        callback(err);
      }
      Bet.insertCurrent(USERIDTHIRD, currentParamsSecond,
        function (err) {
          if (err) {
            callback(err);
          }
          callback(null);
        });
    });
}

function compareAgainstPendingParams(result) {
  var testAgainst = null;

  if (result.bet_id === BETIDFIRST) {
    testAgainst = pendingParamsFirst;
  }
  else if (result.bet_id === BETIDSECOND) {
    testAgainst = pendingParamsSecond;
  }

  for (var i = 0; i < pendingFields.length; i++) {
    if ((i === betValueIndex) || (i === multiplierIndex)) {
      result.should.have.property(pendingFields[i], testAgainst[i].value);
    }
    else {
      result.should.have.property(pendingFields[i], testAgainst[i]);
    }
  }
}

function testSelectMultiple(callback) {
  Bet.selectMultiple('pending_bets', [BETIDFIRST, BETIDSECOND],
    function(err, result) {
      if (err) {
        callback(err);
      }
      result.should.have.length(2);
      compareAgainstPendingParams(result[0]);
      compareAgainstPendingParams(result[1]);
      callback(null);
    }); 
}

function compareAgainstCurrentParams(result) {
  var testAgainst = null;

  if (result.bet_id === BETIDFIRST) {
    testAgainst = currentParamsFirst;
  }
  else if (result.bet_id === BETIDSECOND) {
    testAgainst = currentParamsSecond;
  }

  for (var i = 0; i < currentFields.length; i++) {
    if ((i === betValueIndex) || (i === multiplierIndex)) {
      result.should.have.property(currentFields[i], testAgainst[i].value);
    }
    else {
      result.should.have.property(currentFields[i], testAgainst[i]);
    }
  }
}

function testSelectUsingUserId(callback) {
  Bet.selectUsingUserId('current_bets', USERIDTHIRD,
    function(err, result) {
      if (err) {
        callback(err);
      }
      result.should.have.length(1);
      compareAgainstCurrentParams(result[0]);
      callback(null);
  }); 
}

function testSelectUsingPlayerId(callback) {
  Bet.selectUsingPlayerId('current_bets', PLAYERID,
    function(err, result) {
      if (err) {
        callback(err);
      }
      result.should.have.length(2);
      compareAgainstCurrentParams(result[0]);
      compareAgainstCurrentParams(result[1]);
      callback(null);
  });  
}

describe('bet module test', function () {
  it('test all functions', 
    function(done) {
      async.waterfall([
        testDelete,
        testInsertPending,
        testSelectMultiple,
        testInsertCurrent,
        testSelectUsingUserId,
        testSelectUsingPlayerId,
        testDelete
        ],
        function (err) {
          if (err) {
            console.log(err);
            console.log(err.stack);
          }
          else {
            done();
          }
        });
    }
  );
});*/