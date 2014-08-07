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
  async.parallel(
  [
    function(callback) {
      updateBaseballGames.update(callback);
    }
    //add other sports
  ],
  function(err) {
    if (err) {
      callback(err);
    }
    else {
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
            configs.globals.allGamesCacheJSON = JSON.stringify({
              gamesList: gamesCache.allGamesList,
              gamesIdMap: result.retVal
            });
            callback(null);
          }
        });
      }
  });
}
exports.updateGames = updateGames;