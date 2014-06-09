'use strict';
require('rootpath')();

var async = require('async');
var Player = require('libs/cassandra/player');
var TESTID = '12000000-0000-0000-0000-000000005eb7';
var currentValueIndex = 0;
var fullNameIndex = 1;
var firstNameIndex = 2;
var lastNameIndex = 3;
var teamIndex = 4;
var ageIndex = 5;
var biographyIndex = 6;

function testDelete(callback) {
  Player.delete(TESTID, function (err) {
    if (err) {
      callback(err);
    }
    callback(null);
  })
}

var fields = 
[
TESTID, //id
100,  //currentValue
'hello world', //fullName
'hello',  //firstName
'world',  //lastName
'worldteam',  //team
'10',  //age
'mybio' //biography
];
function testInsert(callback) {
  Player.insert(TESTID, fields, function (err) {
    callback(err);
  });
}


var updateParams = 
[
'currentValue',
'fullName',
'lastName',
'team',
'age',
'biography'
];
var updateFields = 
[
100,  //currentValue
'world hello', //fullName
'hello',  //firstName
'world',  //lastName
'worldteam',  //team
'20',  //age
'mybio' //biography
];

function testUpdate(callback) {
  Player.update(TESTID, updateParams, updateFields, function (err) {
    if (err) {
      callback(err);
    }
    callback(null);
  });
}

function compareAgainstUpdateFields(result) {
  result.should.have.property('playerId', TESTID);
  result.should.have.property('currentValue', updateFields[currentValueIndex]);
  result.should.have.property('fullName', updateFields[fullNameIndex]);
  result.should.have.property('firstName', updateFields[firstNameIndex]);
  result.should.have.property('lastName', updateFields[lastNameIndex]);
  result.should.have.property('team', updateFields[teamIndex]);
  result.should.have.property('age', updateFields[ageIndex]);
  result.should.have.property('biography', updateFields[biographyIndex]);
}

function testSelectByPlayerId(callback) {
  Player.select('playerId', TESTID, function(err, result) {
    if (err) {
      callback(err);
    }
    compareAgainstUpdateFields(result);
    callback(null);
  }); 
}

function testSelectByTeamId(callback) {
  Player.select('team', updateFields[teamIndex], function(err, result) {
    if (err) {
      callback(err);
    }
    compareAgainstUpdateFields(result);
    callback(null);
  });
}

function testSelectBeforeDelete(callback) {
  Player.selectSinceTime(TESTID, new Date(2014, 5, 2), function (err, result) {
    if (err) {
      callback(err);
    }
    result.should.have.length(arrlength);
    result[0].should.have.property('dateOf(time)');
    result[0].should.have.property('price', 0);
    result[arrlength - 1].should.have.property('price', arrlength - 1);
    callback(null);
  })
}

function testSelectAfterDelete(callback) {
  Player.selectSinceTime(TESTID, new Date(2014, 5, 2), function (err, result) {
    if (err) {
      callback(err);
    }
    result.should.have.length(0);
    callback(null);
  })
}

describe('insert, select, delete', function () {
  it('should return '+arrlength +' results and then delete all', 
    function(done) {
      async.waterfall([
        testDelete,
        testInsert,
        testSelectBeforeDelete,
        testDelete,
        testSelectAfterDelete
        ],
        function (err) {
          (err == null).should.be.true;
          done();
        });
    }
  );
});