/*'use strict';
require('rootpath')();

var async = require('async');
var Game = require('libs/cassandra/baseball/game');
var TESTID = '00000000-0000-0000-0000-000000000002';

function testDelete(callback) {
  Game.delete(TESTID, function (err) {
    if (err) {
      callback(err);
    }
    callback(null);
  })
}

var fields =
[
  10, //away_score
  50, // end_time
  1, // game_id
  40, // game_date
  10, //home_score
  'Bubba', //long_away_name
  'Shrimp', //long_home_name
  ['JoeBiden'], //players
  ['hesucks'], //play_by_play
  'Joe', //short_away_name
  'Biden', //short_home_name
  500, // start_time
  'dead' // status

];
function testInsert(callback) {
  Game.insert(fields, function (err) {
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
  away_score: 11,
  end_time: 10,
  game_id: 1,
  game_date: 40,
  home_score: 5,
  long_away_name: 'Barack',
  long_home_name: 'Obama',
  players: ['Hello'],
  play_by_play: ['hi'],
  short_away_name: 'Mitch',
  short_home_name: 'Hedberg',
  start_time: 2,
  status: 'alive'
}


function testUpdate(callback) {
  Game.update(TESTID, update, function (err) {
    if (err) {
      callback(err);
    }
    callback(null);
  });
}

function compareAgainstUpdateFields(result) {
  result.should.have.property('game_id', TESTID);
  result.should.have.property(
    'away_score', update.away_score);
  result.should.have.property('end_time', update.end_time);
  result.should.have.property('game_id', update.game_id);
  result.should.have.property('game_date', update.game_date);
  result.should.have.property('long_away_name', update.long_away_name);
  result.should.have.property('long_home_name', update.long_home_name);
  result.should.have.property('players', update.players);
  result.should.have.property('play_by_play', update.play_by_play);
  result.should.have.property('short_away_name', update.short_away_name);
  result.should.have.property(
    'short_home_name', update.short_home_name);
  result.should.have.property('start_time', update.start_time);
  result.should.have.property('status', update.status);
}


function testSelectByGameId(callback) {
  Game.select(TESTID, function(err, result) {
    if (err) {
      callback(err);
    }
    else {
      compareAgainstUpdateFields(result);
      callback(null);
    }
  });
}

describe('baseballGame module test', function () {
  it('test all functions',
    function(done) {
      async.waterfall([
        testInsert,
        testUpdate,
        testSelectByGameId
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