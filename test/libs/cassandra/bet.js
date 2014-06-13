'use strict';
require('rootpath')();

var async = require('async');
var Bet = require('libs/cassandra/bet');
var BETIDFIRST = '10cf667c-24e2-11df-8924-001ff3591711';
var BETIDSECOND = '10cf667c-24e2-11df-8924-001ff3591712';
var USERIDFIRST = '12000000-0000-0000-0000-000000005eb5';
var USERIDSECOND = '12000000-0000-0000-0000-000000005eb6';
var PLAYERID = '00000000-0000-0000-0000-000000000001';
var userIdIndex = 0;
var longPositionIndex = 1;
var playerIdIndex = 2;
var betValueIndex = 3;
var MultiplierIndex = 4;
var gameIdIndex = 5;
var expirationIndex = 6;

var paramsFirst =
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

var paramsSecond =
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
  Bet.insertPending(paramsFirst, function (err) {
    if (err) {
      callback(err);
    }
    Bet.insertPending(paramsSecond, function (err) {
      if (err) {
        callback(err);
      }
      callback(null);
    });
  });
}

var updateFields = 
[
'email',
'verified',
'verified_time',
'username',
'password',
'first_name',
'last_name',
'age',
'address',
'payment_info',
'money',
'fbid',
'vip_status',
'image'
]
var updateParams = 
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
{ value: -100, hint: 'double' }, //money
'foo.bar.7000',  //fbid
5, //vip_status
'../tmp/images/new_username.jpeg'//image
];

function testUpdate(callback) {
  User.update(TESTIDFIRST, updateFields, updateParams, function (err) {
    if (err) {
      callback(err);
    }
    callback(null);
  });
}

function compareAgainstUpdateParams(result) {
  result.should.have.property('user_id', TESTIDFIRST);

  for (var i = 0; i < updateFields.length; i++) {
    if (i === moneyIndex) {
      result.should.have.property(updateFields[i], updateParams[i].value);
    }
    else {
      result.should.have.property(updateFields[i], updateParams[i]);
    }
  }
}

function testSelectByUserId(callback) {
  User.select('user_id', TESTIDFIRST, function(err, result) {
    if (err) {
      callback(err);
    }
    compareAgainstUpdateParams(result);
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
        testDelete,
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