/*
 * =============================================================================
 * Author: Taehoon Lee
 * Date: 8/1/2014
 * Documentation:
 * must have jquery before this
 * include this file before any other non-jquery file to access athletes
 *
 * exports the object contestALoadGaCache
 * which has methods:
 *   -getAthleteById
 *     args: (id)
 *     returns: athlete object
 *   -getAthletesArray
 *     returns: array of all athletes
 *     
 * NEED TO HIDE LOAD CACHE FUNCTIONS!!!!
 * =============================================================================
 */

/* global async */
'use strict';

(function (exports) {

  /**
   * returns an athlete object corresponding to given id
   * @param  {uuid} id
   * @return {object}    athlete object
   */


  function compareTopPlayers(athlete, callback) {
    var statistics = athlete.statistics;
    var statisticsLength = athlete.statistics.length;
    var fantasyPoints = [(statisticsLength > 0
                          ? statistics[statisticsLength - 1].fantasyPoints : 0),
                         (statisticsLength > 1
                          ? statistics[statisticsLength - 2].fantasyPoints: 0)];
    callback(null, (fantasyPoints[1] - fantasyPoints[0]));
  }

/*
  function sendMarketHomeTopPlayers(req, res, next) {
    async.waterfall([
      function (callback) {
        callback(null, Athletes.Select.getAllAthletesList());
      },
      function (athletes, callback) {
        async.map(athletes, parseTopPlayers, callback);
      },
      function (athletes, callback) {
        async.sortBy(athletes,
          function(athlete, callback) {
            callback(null, -1 * athlete.change);
          }, callback);
      },
      function (athletes, callback) {
        res.send(JSON.stringify(athletes.slice(0, 50)));
      }],
      function (err) {
        next(err);
      });
  }
*/

  function getTopPlayers (callback) {
  /*$.ajax({
    url: '/marketHomeTopPlayers',
    type: 'GET',
    success: function (response) {*/
    async.sortBy(exports.getAthletesArray(), compareTopPlayers,
      function (err, athletes) {
        if (err) {
          callback(err);
        }
        else {
          var array = athletes.slice(0, 50);
          var index = 0;
          async.reduce(array, '',
            function (memo, athlete, callback) {
              var statistics = athlete.statistics;
              var statisticsLength = athlete.statistics.length;
              var fantasyPoints = [(statisticsLength > 0
                                    ? statistics[statisticsLength - 1].fantasyPoints : 0),
                                   (statisticsLength > 1
                                    ? statistics[statisticsLength - 2].fantasyPoints: 0)];
              var change = fantasyPoints[0] - fantasyPoints[1];

              memo += ('<p>' +
                         (athlete.fullName ? athlete.fullName : athlete.athleteId) +
                          ' ' +
                          fantasyPoints[0]);

              if (change >= 0) {
                memo += ('&#160;<img src=\'/assets/uparrow.png\' style=\'width: 12px\'>&#160;' +
                         change +
                         '</p>');
              }
              else {
                memo += ('&#160;<img src=\'/assets/downarrow.png\' style=\'width: 12px\'>&#160;' +
                         change +
                         '</p>');
              }

              if (index !== array.length - 1) {
                memo += '<p>&#160;&#160;&#160;&#160;&#160</p>';
              }

              index++;

              callback(null, memo);
            },
            function (err, tickerContent) {
              if (err) {
                callback(err);
              }
              else {
                $('#top-player-ticker').html(tickerContent);
                callback(null);
              }
            });
        }
      });
        /*callback(null);
      },
      failure: function (response) {
        callback(new Error('Cannot get top players.'));
      }
    });*/
  }


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