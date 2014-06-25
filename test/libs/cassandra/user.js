/*
'use strict';
require('rootpath')();

var async = require('async');
var User = require('libs/cassandra/user');
var TESTIDFIRST = '451bd553-0ec2-4c1b-a14b-25eaab441457';
var TESTIDSECOND = '451bd553-0ec2-4c1b-a14b-25eaab441458';
var emailIndex = 0;
var verifiedIndex = 1;
var verifiedTimeIndex = 2;
var usernameIndex = 3;
var passwordIndex = 4;
var firstNameIndex = 5;
var lastNameIndex = 6;
var ageIndex = 7;
var addressIndex = 8;
var paymentInfoIndex = 9;
var moneyIndex = 10;
var fbidIndex = 11;
var vipStatusIndex = 12;
var imageIndex = 13;

function testDelete(callback) {
  User.delete(TESTIDFIRST, function (err) {
    if (err) {
      callback(err);
    }
    callback(null);
  });
}

var params = 
[
TESTIDFIRST, //id
'test@email.com',  //email
false, //verified
null,  //verified_time
'test_username',  //username
'test_password',  //password
'foo', //first_name
'bar', //last_name
7500, //age
'9001 Test Drive Centralia, PA 00000', //address
'some card', //payment_info
{ value: 10000, hint: 'double' }, //money
{ value: 10000, hint: 'double'},
'foo.bar.7000',  //fbid
2, //vip_status
'../tmp/images/test_username.jpeg'//image
];
function testInsert(callback) {
  User.insert(params, function (err) {
    if (err) {
      callback(err);
    }
    callback(null);
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
'spending_power',
'fbid',
'vip_status',
'image'
]
var updateParams = 
[
'test@email.com',  //email
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
{ value: -100, hint: 'double'}, //spending_power
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
{ value: 4900, hint: 'double'}, //spending_power
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
*/