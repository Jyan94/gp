'use strict';
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
var longPositionIndex = 2;
var playerIdIndex = 3;
var betValueIndex = 4;
var multiplierIndex = 5;
var gameIdIndex = 6;
var expirationIndex = 7;

var pendingFields =
[
'bet_id',
'user_id',
'long_position',
'player_id',
'bet_value',
'multiplier',
'game_id',
'expiration'
]

var pendingParamsFirst =
[
BETIDFIRST, //bet_id
USERIDFIRST, //user_id
true, //long_position
PLAYERID, //player_id
{ value: 100, hint: 'double' }, //bet_value
{ value: 10, hint: 'double' }, // multiplier
'10000000-0000-0000-0000-000000000001', //game_id
'10cf667c-24e2-11df-8924-001ff3591715' //expiration
]

var pendingParamsSecond =
[
BETIDSECOND, //bet_id
USERIDSECOND, //user_id
false, //long_position
PLAYERID, //player_id
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

var currentfields =
[
'bet_id',
'long_better_id',
'short_better_id',
'player_id',
'bet_value',
'multiplier',
'game_id',
'expiration'
]

var currentParamsFirst =
[
BETIDFIRST, //bet_id
USERIDFIRST, //user_id
USERIDSECOND, //long_position
PLAYERID, //player_id
{ value: 100, hint: 'double' }, //bet_value
{ value: 10, hint: 'double' }, // multiplier
'10000000-0000-0000-0000-000000000001', //game_id
'10cf667c-24e2-11df-8924-001ff3591715' //expiration
]

var currentParamsSecond =
[
BETIDSECOND, //bet_id
USERIDTHIRD, //user_id
USERIDSECOND, //long_position
PLAYERID, //player_id
{ value: 200, hint: 'double' }, //bet_value
{ value: 3, hint: 'double' }, // multiplier
'10000000-0000-0000-0000-000000000001', //game_id
'10cf667c-24e2-11df-8924-001ff3591716' //expiration
]
function testCurrentPending(callback) {
  Bet.currentPending(USERIDSECOND, currentParamsFirst,
    function (err) {
      if (err) {
        callback(err);
      }
      Bet.currentPending(USERIDTHIRD, currentParamsSecond,
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
  else if (result.user_id === BETIDSECOND) {
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

function testSelectByUsername(callback) {
  User.select('username', updateParams[usernameIndex], function(err, result) {

    if (err) {
      callback(err);
    }
    compareAgainstUpdateParams(result);
    callback(null);
  }); 
}

function testSelectByEmail(callback) {
  User.select('email', updateParams[emailIndex], function(err, result) {
    if (err) {
      callback(err);
    }
    compareAgainstUpdateParams(result);
    callback(null);
  });
}

var newMoney = 5000;

var updateParamsNewMoney = 
[
'email@test.com',  //email
true, //verified
'ce3c0eb0-f04c-11e3-a570-c5b492d64738',  //verified_time
'new_username',  //username
'new_password',  //password
'foofoobar', //first_name
'foobarbar', //last_name
7500, //age
'8999 Test Drive Centralia, PA 00000', //address
'some different card', //payment_info
{ value: 4900, hint: 'double' }, //money
'foo.bar.7000',  //fbid
5, //vip_status
'../tmp/images/new_username.jpeg'//image
];
function testUpdateMoney(callback) {
  User.updateMoney([newMoney], [TESTIDFIRST], function(err, result) {
    if (err) {
      callback(err);
    }
    callback(null);
  });
}

function compareAgainstUpdateParamsNewMoney(result) {
  result.should.have.property('user_id', TESTIDFIRST);

  for (var i = 0; i < updateFields.length; i++) {
    if (i === moneyIndex) {
      result.should.have.property(updateFields[i],
                                  updateParamsNewMoney[i].value);
    }
    else {
      result.should.have.property(updateFields[i], updateParamsNewMoney[i]);
    }
  }
}

function testSelectMultiple(callback) {
  User.selectMultiple([TESTIDFIRST, TESTIDSECOND], function(err, result) {
    if (err) {
      callback(err);
    }
    result.should.have.length(1);
    result = result[0];
    compareAgainstUpdateParamsNewMoney(result);
    callback(null);
  });
}

describe('user module test', function () {
  it('test all functions', 
    function(done) {
      async.waterfall([
        testInsertPending,
        testInsert,
        testUpdate,
        testSelectByUserId,
        testSelectByUsername,
        testSelectByEmail,
        testUpdateMoney,
        testSelectMultiple,
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
});