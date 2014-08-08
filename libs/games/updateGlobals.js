//THIS ONLY PULLS TODAY'S GAMES
//CHANGE LATER IF POSSIBLE
//THIS ONLY PULLS TODAY'S GAMES
//CHANGE LATER IF POSSIBLE
//THIS ONLY PULLS TODAY'S GAMES
//CHANGE LATER IF POSSIBLE
//THIS ONLY PULLS TODAY'S GAMES
//CHANGE LATER IF POSSIBLE
//THIS ONLY PULLS TODAY'S GAMES
//CHANGE LATER IF POSSIBLE

'use strict';
require('rootpath')();

var async = require('async');
var configs = require('config/index');
var updateBaseballGames = require('libs/games/baseball.js');
var gamesCache = configs.globals.games;

//TODO: update other sports too
function updateGames(callback) {
  async.waterfall([
    function (callback) {
      async.parallel(
        [
          function(callback) {
            updateBaseballGames.update(callback);
          }
          //add other sports
        ],
        function (err) {
          callback(err);
        });
    },
    function (callback) {
      gamesCache.allGamesList = [].concat(
        gamesCache.baseballList,
        gamesCache.footballList,
        gamesCache.basketballList);

      async.reduce(
        gamesCache.allGamesList,
        {
          index: 0,
          retVal: {}
        },
        function(memo, gameObj, callback) {
          memo.retVal[gameObj.id] = memo.index;
          ++memo.index;
          callback(null, memo);
        },
        function(err, result) {
          if (err) {
            callback(err);
          }
          else {
            gamesCache.allGamesIdMap = result.retVal;
            callback(null);
          }
        });
    },
    function (callback) {
      async.reduce(
        gamesCache.allGamesList,
        {},
        function (memo, gameObj, callback) {
          memo[gameObj.longAwayName] = gameObj.id;
          memo[gameObj.longHomeName] = gameObj.id;
          callback(null, memo);
        },
        function (err, result) {
          if (err) {
            callback(err);
          }
          else {
            gamesCache.longTeamNameToGameMap = result;
            callback(null);
          }
        });
    }],
    function (err) {
      if (err) {
        callback(err);
      }
      else {
        configs.globals.allGamesCacheJSON = JSON.stringify({
            gamesList: gamesCache.allGamesList,
            gamesIdMap: gamesCache.allGamesIdMap,
            longTeamNameToGameMap: gamesCache.longTeamNameToGameMap
          });

        callback(null);
      }
    });
}
exports.updateGames = updateGames;