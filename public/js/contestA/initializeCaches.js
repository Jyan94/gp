/*
 * =============================================================================
 * Author: Taehoon Lee
 * Date: 8/1/2014
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
 *
 * NEED TO HIDE LOAD CACHE FUNCTIONS!!!!
 * =============================================================================
 */

/* global async */
/* global contestALoadAthletesCache */
/* global contestALoadGamesCache */
'use strict';

(function (exports) {
  var POLL_INTERVAL = 60000;
  var CUTOFF = 50;

  var searchedAthleteObj = {};

  /*
   * ===========================================================================
   * INITIALIZE TOP PLAYER TICKER
   * ===========================================================================
   */

  function compareTopPlayers (athlete, callback) {
    var statistics = athlete.statistics;
    var statisticsLength = athlete.statistics.length;
    var fantasyPoints = [(statisticsLength > 0
                          ? statistics[statisticsLength - 1].fantasyPoints : 0),
                         (statisticsLength > 1
                          ? statistics[statisticsLength - 2].fantasyPoints: 0)];
    callback(null, (fantasyPoints[1] - fantasyPoints[0]));
  }

  function getTopPlayers (callback) {
    async.sortBy(contestALoadAthletesCache.getAthletesArray(),
      compareTopPlayers,
      function (err, athletes) {
        if (err) {
          callback(err);
        }
        else {
          var array = athletes.slice(0, CUTOFF);
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
                         (athlete.fullName ? athlete.fullName : athlete.athleteId));

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

              if (index !== CUTOFF - 1) {
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
                $('#top-player-ticker-text').html(tickerContent);
                callback(null);
              }
            });
        }
      });
  }

  /*
   * ===========================================================================
   * INITIALIZE AUTOCOMPLETE
   * ===========================================================================
   */

  function getSearchedAthleteObj () {
    return searchedAthleteObj;
  }

  function initAutocomplete(callback) {
    async.map(contestALoadAthletesCache.getAthletesArray(),
      function (athlete, callback) {
        athlete.label = athlete.fullName;
        callback(null, athlete);
      },
      function (err, result) {
        if (err) {
          callback(err);
        }
        else {
          $('#autocomplete').autocomplete({
            source: result,
            select: function(e, ui) {
              searchedAthleteObj = contestALoadAthletesCache.getAthleteById(ui.item.id);
              $('.playercard1#create')
                .find('.playercard1-info.name p')
                .replaceWith('<p>' + searchedAthleteObj.fullName + '</p');
              $('.playercard1#create')
                .find('.playercard1-info.pos p')
                .replaceWith('<p>' + searchedAthleteObj.position + ' | ' +
                  searchedAthleteObj.longTeamName + '</p');
              $('.playercard1#create')
                .find('.playercard1-playerpic img')
                .replaceWith('<img src=\'' + searchedAthleteObj.image +
                 '\'' + 'width=\'250\' height=\'250\' onError= \"this.onerror=null;this.src=\'/assets/noimage.jpg\';\">');
            },
            delay: 500,
          }).data('ui-autocomplete')._renderItem = function ( ul, item ) {
              return $('<li>')
                .append('<a><img style="background-image: url(' +
                  item.image + ')">' + item.label + '</a>')
                .appendTo(ul);
              }

          callback(null);
        }
      });
  }

  /*
   * ===========================================================================
   * INITIALIZE DAILY BOXSCORES TICKER
   * ===========================================================================
   */

  var formatTime = function (oldTime) {
    var time = new Date(oldTime);
    var timeHalf = (time.getHours() > 11 ? ' PM' : ' AM');
    var timeString = (((time.getHours() + 11) % 12) + 1
                      + time.toTimeString().substring(2, 8)
                      + timeHalf);

    return timeString;
  }

  function getDailyBoxscores (callback) {
    var array = contestALoadGamesCache.getGamesArray();
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

        //if (index !== array.length - 1) {
          memo += '<p>&#160;&#160;&#160;&#160;&#160</p>';
        //}

        index++;

        callback(null, memo);
      },
      function (err, tickerContent) {
        if (err) {
          callback(err);
        }
        else {
          $('#daily-boxscore-ticker-text').html(tickerContent);
          callback(null);
        }
      });
  }

  /*
   * ===========================================================================
   * INITIALIZE SHORT TEAM NAME TO GAME CACHE
   * ===========================================================================
   */
  /*
  function getGameByShortTeamName (shortTeamName) {
    return contestALoadGamesCache.getGameById(
      shortTeamNameToGameMap[shortTeamName]);
  }

  function getGameByAthlete (athlete) {
    return getGameByShortTeamName(athlete.shortTeamName);
  }

  function getGameByAthleteId (athleteId) {
    return getGameByAthlete(
      contestALoadAthletesCache.getAthleteById(athleteId));
  }

  function loadShortTeamNameToGameCache (callback) {
    async.reduce(contestALoadGamesCache.getGamesArray(),
      {},
      function (memo, game, callback) {
        memo[game.shortAwayName] = game.id;
        memo[game.shortHomeName] = game.id;

        callback(null, memo);
      },
      function (err, result) {
        if (err) {
          callback(err);
        }
        else {
          shortTeamNameToGameMap = result;
          callback(null);
        }
      });
  }
*/
  /*
   * ===========================================================================
   * RUN IT ALL
   * ===========================================================================
   */

  function customSetInterval (func, interval) {
    var callback = function (err) {
      if (err) {
        console.log(err);
      }

      setTimeout(function () {
        customSetInterval(func, interval);
      }, interval);
    };

    func(callback);
  }

  function initializeCaches (callback) {
    async.parallel([
        function (callback) {
          async.waterfall([
              contestALoadAthletesCache.loadAthletesFromServer,
              function (callback) {
                async.parallel([
                    getTopPlayers,
                    initAutocomplete
                  ],
                  callback);
              }
            ],
            callback);
        },
        function (callback) {
          async.waterfall([
              contestALoadGamesCache.loadGamesFromServer,
              getDailyBoxscores
            ],
            callback);
        }
      ],
      /*function (err) {
        if (err) {
          callback(err);
        }
        else {
          loadShortTeamNameToGameCache(callback);
        }
      })*/
      callback);
  }

  customSetInterval(initializeCaches, POLL_INTERVAL);
  exports.getSearchedAthleteObj = getSearchedAthleteObj;
  /*exports.getGameByShortTeamName = getGameByShortTeamName;
  exports.getGameByAthlete = getGameByAthlete;
  exports.getGameByAthleteId = getGameByAthleteId;*/
}(typeof exports === 'undefined' ?
    window.initializeCaches = {} :
    exports));