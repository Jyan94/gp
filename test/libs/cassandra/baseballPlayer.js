/*'use strict';
require('rootpath')();

var async = require('async');
var Player = require('libs/cassandra/baseball/player');
var TESTID = '00000000-0000-0000-0000-000000000002';
var SHORT_TEAM_INDEX = 5;
var LONG_TEAM_INDEX = 6;
var STATISTICS_INDEX = 15;

var testDate0 = new Date();
var date = ('0' + testDate0.getDate()).slice(-2);
var month = ('0' + (testDate0.getMonth() + 1)).slice(-2);
var year = 1990;
testDate0 = year + '/' + month + '/' + date;
++year;
var testDate1 = year + '/' + month + '/' + date;

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
  100,  //current_value
  'Joe Biden', //full_name
  'Joe',  //first_name
  'Biden',  //last_name
  'LAC TEST',  //short_team_name
  'Los Angeles Clippers TEST',  //long_team_name
  'active', //status
  'shortstop', //position
  'url', //profile url
  2, //uniform number
  71, //height
  1000, //weight
  30,  //age
  'the image', //image
  {}  //statistics
];
fields[STATISTICS_INDEX][testDate0] = '30 rbi';

var addStatistic = 'added statistic';

function testInsert(callback) {
  Player.insert(fields, function (err) {
    if (err) {
      callback(err);
    }
    else {
      callback(null);
    }
  });
}


var update = 
{
  current_value: 100,
  full_name: 'Barack Obama',
  first_name: 'Barack',
  last_name: 'Obama',
  short_team_name: 'LAL',
  long_team_name: 'Los Angeles Lakers',
  status: 'injured',
  position: 'pitcher',
  profile_url: 'testerino',
  uniform_number: 15,
  height: 71,
  weight: 400,
  age: 20,
  image: 'img.txt',
  statistics: {}
}
update.statistics[testDate0] = '30 rbi';

function testUpdate(callback) {
  Player.update(TESTID, update, function (err) {
    if (err) {
      callback(err);
    }
    else {
      callback(null);
    }
  });
}

function compareAgainstUpdateFields(result) {
  result.should.have.property('athlete_id', TESTID);
  result.should.have.property(
    'current_value', update.current_value);
  result.should.have.property('full_name', update.full_name);
  result.should.have.property('first_name', update.first_name);
  result.should.have.property('last_name', update.last_name);
  result.should.have.property('long_team_name', update.long_team_name);
  result.should.have.property('short_team_name', update.short_team_name);
  result.should.have.property('status', update.status);
  result.should.have.property('position', update.position);
  result.should.have.property('profile_url', update.profile_url);
  result.should.have.property(
    'uniform_number', update.uniform_number);
  result.should.have.property('age', update.age);
  result.should.have.property('height', update.height);
  result.should.have.property('weight', update.weight);
  result.should.have.property('image', update.image);
  result.should.have.property('statistics', update.statistics);
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

function testSelectByTeamName(callback) {
  async.parallel(
  [
    function(callback) {
      Player.selectUsingLongTeamName(
        fields[LONG_TEAM_INDEX], 
        function(err, result) {
          (err === null).should.be.true;
          result = result[0];
          compareAgainstUpdateFields(result);
          callback(null);
        });
    },
    function(callback) {
      Player.selectUsingLongTeamName(SHORT_TEAM_INDEX, function(err, result) {
        (err === null).should.be.true;
        result = result[0];
        compareAgainstUpdateFields(result);
        callback(null);
      });
    },
  ],
  callback);
}

function testAddAndDeleteStatistic(callback) {
  async.waterfall(
  [
    function(callback) {
      Player.addStatistic(TESTID, testDate1, addStatistic, function(err) {
        (err === null).should.be.true;
        callback(null);
      });
    },
    function(callback) {
      Player.select(TESTID, function(err, result) {
        (err === null).should.be.true;
        result.should.have.property('statistics');
        Object.keys(result.statistics).should.have.length(2);
        //result.statistics[1].should.equal(addStatistic);
        callback(null);
      });
    },
    function(callback) {
      Player.deleteStatistics(TESTID, testDate1, function(err) {
        (err === null).should.be.true;
        callback(null);
      });
    },
    function(callback) {
      Player.select(TESTID, function(err, result) {
        (err === null).should.be.true;
        result.should.have.property('statistics');
        Object.keys(result.statistics).should.have.length(1);
        callback(null);
      });
    }
  ],
  callback);
}

describe('baseballPlayer module test', function () {
  it('test all functions except selectImages and autocomplete',
    function(done) {
      async.waterfall([
        testDelete,
        testInsert,
        testUpdate,
        testSelectByPlayerId,
        testAddAndDeleteStatistic,
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