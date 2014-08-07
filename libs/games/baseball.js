/**
 * ====================================================================
 * Author: Harrison Zhao
 * ====================================================================
 */
'use strict';
require('rootpath')();

var async = require('async');
var BaseballGames = require('libs/cassandra/baseball/game');
var configs = require('config/index');
var gamesCache = configs.globals.games;
var BASEBALL = configs.constants.sportNames.baseball;

//TODO make sure images are already set in database
function formatGame(game, callback) {
  var retval = {
    awayScore: game.away_score,
    currentInning: game.current_inning,
    endTime: game.end_time,
    id: game.game_id,
    gameDate: game.game_date,
    homeScore: game.home_score,
    longAwayName: game.long_away_name,
    longHomeName: game.long_home_name,
    shortAwayName: game.short_away_name,
    shortHomeName: game.short_home_name, //acronym for home team
    startTime: game.start_time,
    status: game.status
  };
  async.map(
    (game.athletes ? game.athletes : []), 
    function (athlete, callback) {
      callback(null, JSON.parse(athlete));
    },
    function (err, athletes) {
      retval.athletes = athletes;
      callback(null, retval);
    });
}

//callback args: (err)
function update(callback) {
  async.waterfall(
  [
    function(callback) {
      BaseballGames.selectTodaysGames(callback);
    },
    function(games, callback) {
      async.map(
        games, 
        formatGame,
        callback);
    },
    function(formattedGames, callback) {
      gamesCache.baseballList = formattedGames;
      async.reduce(
        formattedGames, 
        {idMap: {}, index: 0}, 
        function(memo, game, callback) {
          memo.idMap[game.id] = memo.index;
          ++memo.index;
          callback(null, memo)
        }, 
        function(err, result) {
          gamesCache.baseballIdMap = result.idMap;
          callback(null);
        });
    }
  ],
  callback);
}

exports.update = update;