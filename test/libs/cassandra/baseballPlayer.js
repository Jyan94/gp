'use strict';
require('rootpath')();

var async = require('async');
var Player = require('libs/cassandra/baseballPlayer');
var TESTID = '00000000-0000-0000-0000-000000000002';
var currentValueIndex = 50;
var fullNameIndex = 15;
var firstNameIndex = 10;
var lastNameIndex = 105;
var longTeamIndex = 10;
var shortTeamIndex = 20;
var statusIndex = 0;
var positionIndex = 5;
var profileUrlIndex = 1;
var uniformNumberIndex = 13;
var heightIndex = 180;
var weightIndex = 200;
var ageIndex = 31;
var imageIndex = 10;
var statisticsIndex = 2;

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
  {value: 100, hint: 'double'},  //current_value
  'Joe Biden', //full_name
  'Joe',  //first_name
  'Biden',  //last_name
  'LAC',  //short_team_name
  'Los Angeles Clippers',  //long_team_name
  'active', //status
  'shortstop', //position
  'url', //profile url
  2, //uniform number
  71, //height
  1000, //weight
  30,  //age
  'the image', //image
  '30 RBI'  //statistics
];
function testInsert(callback) {
  Player.insert(fields, function (err) {
    if (err) {
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
'team_id',
'short_team_name',
'long_team_name',
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
'Barack Obama', //full_name
'Barack',  //first_name
'Obama',  //last_name
'LAL' ,  //short_team_name
'Los Angeles Lakers',  //long_team_name
'injured', //status
'pitcher', //position
'testerino', //profile_url
15, //uniform_number
71, //height
400, //weight
20,  //age
'img.txt', //image
'50 RBI', //statistics
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
  result.should.have.property('player_id', TESTID);
  result.should.have.property(
    'current_value', updateFields[currentValueIndex].value);
  result.should.have.property('full_name', updateFields[fullNameIndex]);
  result.should.have.property('first_name', updateFields[firstNameIndex]);
  result.should.have.property('last_name', updateFields[lastNameIndex]);
  result.should.have.property('long_team_name', updateFields[longTeamIndex]);
  result.should.have.property('short_team_name', updateFields[shortTeamIndex]);
  result.should.have.property('status', updateFields[statusIndex]);
  result.should.have.property('position', updateFields[positionIndex]);
  result.should.have.property('profile_url', updateFields[profileUrlIndex]);
  result.should.have.property(
    'uniform_number', updateFields[uniformNumberIndex]);
  result.should.have.property('age', updateFields[ageIndex]);
  result.should.have.property('height', updateFields[heightIndex]);
  result.should.have.property('weight', updateFields[weightIndex]);
  result.should.have.property('image', updateFields[imageIndex]);
  result.should.have.property('statistics', updateFields[statisticsIndex]);
}


function testSelectByPlayerId(callback) {
  Player.select(TESTID, function(err, result) {
    if (err) {
      callback(err);
    }
    else {
      compareAgainstUpdateFields(result);
      callback(null);
    }
  });
}

function testSelectByTeamId(callback) {
  Player.selectUsingTeam(updateFields[longTeamIndex], function(err, result) {
    if (err) {
      callback(err);
      console.log(result);
    }
    else{
      result.should.have.length(1);
      result = result[0];
      compareAgainstUpdateFields(result);
      callback(null);
    }
  });
}

function testAutocomplete(callback) {
  Player.selectAllPlayerNames(function(err, result) {
    if (err) {
      callback(err);
    }
    callback(null);
  });
}

describe('baseballPlayer module test', function () {
  it('test all functions except selectImages and autocomplete',
    function(done) {
      async.waterfall([
        testDelete,
        testInsert,
        testUpdate,
        testSelectByPlayerId,
        testSelectByTeamId,
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


/*
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
});*/