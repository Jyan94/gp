/*
 * =============================================================================
 * Author: Harrison Zhao, Taehoon Lee
 * Date: 8/6/2014
 * Documentation:
 * must have jquery before this
 * include this file before any other non-jquery file to access athletes
 *
 * exports the object contestALoadGamesCache
 * which has methods:
 *   -getAthleteById
 *     args: (id)
 *     returns: athlete object
 *   -getAthletesArray
 *     returns: array of all athletes
 * =============================================================================
 */

/* global async */
'use strict';

(function(exports) {
  var gamesList = [];
  var gamesIdMap = {};
  var POLL_INTERVAL = 60000;

  /**
   * returns an game object corresponding to given id
   * @param  {uuid} id
   * @return {object}    game object
   */
  function getGameById(id) {
    return gamesList[gamesIdMap[id]];
  }

  function getGamesArray() {
    return gamesList;
  }

  var formatTime = function (oldTime) {
    var time = new Date(oldTime);
    var timeHalf = (time.getHours() > 11 ? ' PM' : ' AM');
    var timeString = (((time.getHours() + 11) % 12) + 1
                      + time.toTimeString().substring(2, 8)
                      + timeHalf);

    return timeString;
  }
  
  function getDailyBoxscores (callback) {
    /*$.ajax({
      url: '/marketHomeDailyBoxscores',
      type: 'GET',
      success: function (response) {*/

    var array = exports.getGamesArray();
    var index = 0

    async.reduce(array, '',
      function (memo, game, callback) {
        var status = game.status;

        if (status === 'scheduled') {
          memo += ('<p>' +
                     game.shortAwayName + ' at ' + game.shortHomeName +
                     ' begins at ' + formatTime(game.startTime) +
                   '</p>');
        }
        else if (status === 'inprogress') {
          memo += ('<p>' +
                     game.shortAwayName + ' ' + game.awayScore + ' ' +
                     game.shortHomeName + ' ' + game.homeScore +
                     ' Current Inning: ' + game.currentInning +
                   '</p>');
        }
        else if (status === 'closed') {
          memo += ('<p>' +
                     game.shortAwayName + ' ' + game.awayScore + ' ' +
                     game.shortHomeName + ' ' + game.homeScore +
                     ' Final</p>');
        }
        else {
          memo += ('<p>' +
                     game.shortAwayName + ' at ' + game.shortHomeName +
                     ' is ' + formatTime(game.startTime) +
                   '</p>');
        }

        if (index !== array.length - 1) {
          memo += '<p>&#160;&#160;&#160;&#160;&#160</p>';
        }

        index++;
        
        callback(null, memo);
      },
      function (err, tickerContent) {
        $('#daily-boxscore-ticker').html(tickerContent);
      });

    /*    callback(null);
      },
      failure: function (response) {
        callback(new Error('Cannot get daily boxscores.'));
      }
    });*/
  }

  function loadGamesFromServer() {
    $.ajax({
      url: '/getTodaysGames',
      type: 'GET',

      //gets data from server
      //the data is a JSON stringified object
      //{
      //  gamesList: array of athlete objects,
      //  gamesIdMap: object keyed by gameed 
      //    and values index of game in array
      //}
      success: function(data) {
        data = JSON.parse(data);
        gamesList = data.gamesList;
        gamesIdMap = data.gamesIdMap;
        getDailyBoxscores(function (err) {
          if (err) {
            console.log(err);
          }

          setTimeout(loadGamesFromServer, POLL_INTERVAL);
        });
      },
      failure: function (response) {
        console.log(response);
      },
      error: function(xhr, status, err) {
        console.error(xhr, status, err);
      }
    });
  }

  loadGamesFromServer();
  exports.getGameById = getGameById;
  exports.getGamesArray = getGamesArray;
}(typeof exports === 'undefined' ? 
    window.contestALoadGamesCache = {} : 
    exports));