'use strict';
require('rootpath')();

var Player = require('libs/cassandra/baseballPlayer');
var async = require('async');

var TESTID = '12345678-0000-0000-0000-000000005eb7';
var currentValueIndex = 0;
var fullNameIndex = 1;
var firstNameIndex = 2;
var lastNameIndex = 3;
var teamIndex = 4;
var statusIndex = 5;
var positionIndex = 6;
var profileUrlIndex = 7;
var uniformNumberIndex = 8;
var heightIndex = 9;
var weightIndex = 10;
var ageIndex = 11;
var imageIndex = 12;
var statisticsIndex = 13;

function testDelete(callback) {
  Player.delete(TESTID, function (err) {
    if (err) {
      console.log('1');
      callback(err);
    }
    callback(null);
  });
}

var fields = 
[
TESTID, //id
{value: 100, hint: 'double'},  //current_value
'hello world', //full_name
'hello',  //first_name
'world',  //last_name
'worldteam',  //team
'healthy', //status
'quarterback', //position
'url', //profile url
1, //uniform number
61, //height
2000, //weight
10,  //age
'helloworld', //image
['11111111-0000-0000-0000-000000005eb7', '22222222-0000-0000-0000-000000005eb7']
];

function testInsert(callback) {
  Player.insert(fields, function (err) {
    if (err) {
      console.log('2');    
      callback(err);
    }
    callback(null);
  });
}


var updateParams = 
[
'current_value',
'full_name',
'first_name',
'last_name',
'team',
'status',
'position',
'profile_url',
'uniform_number',
'height',
'weight',
'age',
'image',
'statistics'
]
var updateFields = 
[
{value: 100, hint: 'double'},  //current_value
'world hello', //full_name
'hello',  //first_name
'world',  //last_name
'worldteam',  //team
'injured', //status
'quaterback', //position
'hello world', //profile_url
1, //uniform_number
70, //height
4000, //weight
20,  //age
'img.txt', //image
['22222222-0000-0000-0000-000000005eb7', '33333333-0000-0000-0000-000000005eb7']
];
var insertStat = '44444444-0000-0000-0000-000000005eb7';

function testUpdate(callback) {
  Player.update(TESTID, updateParams, updateFields, function (err) {
    if (err) {
      console.log('3');
      callback(err);
    }
    callback(null);
  });
}

function compareAgainstUpdateFields(result) {
  result.should.have.property('player_id', TESTID);
  result.should.have.property(
    'current_value', updateFields[currentValueIndex].value);
  result.should.have.property('full_name', updateFields[fullNameIndex]);
  result.should.have.property('first_name', updateFields[firstNameIndex]);
  result.should.have.property('last_name', updateFields[lastNameIndex]);
  result.should.have.property('team', updateFields[teamIndex]);
  result.should.have.property('status', updateFields[statusIndex]);
  result.should.have.property('position', updateFields[positionIndex]);
  result.should.have.property('profile_url', updateFields[profileUrlIndex]);
  result.should.have.property(
    'uniform_number', updateFields[uniformNumberIndex]);
  result.should.have.property('team', updateFields[teamIndex]);
  result.should.have.property('age', updateFields[ageIndex]);
  result.should.have.property('height', updateFields[heightIndex]);
  result.should.have.property('weight', updateFields[weightIndex]);
  result.should.have.property('image', updateFields[imageIndex]);
  result.should.have.property('statistics', updateFields[statisticsIndex]);
}


function testSelectByPlayerId(callback) {
  Player.select(TESTID, function(err, result) {
    if (err) {
      console.log('4');
      callback(err);
    }
    compareAgainstUpdateFields(result);
    callback(null);
  }); 
}

function testSelectByTeamId(callback) {
  Player.selectUsingTeam(updateFields[teamIndex], function(err, result) {
    if (err) {
      console.log('5');
      callback(err);
    }
    result.should.have.length(1);
    result = result[0];
    compareAgainstUpdateFields(result);
    callback(null);
  });
}

function testAppendStatistics(callback) {
  Player.addStatistics(
    TESTID, 
    insertStat, 
    function(err) {
      if (err) {
        console.log('6');
        callback(err);
      }
      callback(null);
    });
}

function testDeleteStatistics(callback) {
  Player.deleteStatistics(
    TESTID, 
    insertStat, 
    function(err) {
      if (err) {
        console.log('7');
        callback(err);
      }
      callback(null);
    });
}

function testSelectByPlayerIdAfterStatisticInsert(callback) {
  Player.select(TESTID, function(err, result) {
    if (err) {
      console.log('8');
      callback(err);
    }
    result.should.have.property('statistics');
    result.statistics.should.have.length(
      updateFields[statisticsIndex].length + 1);
    callback(null);
  }); 
}

function testSelectByPlayerIdAfterStatisticDelete(callback) {
  Player.select(TESTID, function(err, result) {
    if (err) {
      console.log('9');
      callback(err);
    }
    result.should.have.property('statistics');
    result.statistics.should.have.length(updateFields[statisticsIndex].length);
    callback(null);
  }); 
}

function testAutocomplete(callback) {
  Player.selectAllPlayerNames(function(err, result) {
    if (err) {
      console.log('10');
      callback(err);
    }
    result.should.have.length(1);
    callback(null);
  });
}

function testSelectAfterDelete(callback) {
  Player.select(TESTID, function(err, result) {
    if (err) {
      console.log('11');
      callback(err);
    }
    callback(null);
  });
}

describe('baseball_player module test', function () {
  it('test all baseball_player functions except selectImages', 
    function(done) {
      async.waterfall([
        testDelete,
        testSelectAfterDelete,
        testInsert,
        testUpdate,
        testSelectByPlayerId,
        testSelectByTeamId,
        testAutocomplete,
        testAppendStatistics,
        testSelectByPlayerIdAfterStatisticInsert,
        testDeleteStatistics,
        testSelectByPlayerIdAfterStatisticDelete,
        testDelete,
        testSelectAfterDelete
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