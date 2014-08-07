/* global contestALoadGamesCache */
/* global contestALoadAthletesCache */

var POLL_INTERVAL = 60000;

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

  var tickerContent = contestALoadGamesCache.getGamesArray().reduce(
    function (memo, game, index, array) {
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

      return memo;
    }, '');

  $('#daily-boxscore-ticker').html(tickerContent);

  setTimeout(getDailyBoxscores);

  /*    callback(null);
    },
    failure: function (response) {
      callback(new Error('Cannot get daily boxscores.'));
    }
  });*/
}

function getTopPlayers (callback) {
  /*$.ajax({
    url: '/marketHomeTopPlayers',
    type: 'GET',
    success: function (response) {*/
  var tickerContent = contestALoadAthletesCache.getAthletesArray().reduce(
    function (memo, athlete, index, array) {
      memo += ('<p>' +
                 (athlete.fullName ? athlete.fullName : athlete.athleteId) +
                 ' ' +
                 athlete.fantasyPoints[0]);

      if (athlete.change >= 0) {
        memo += ('&#160;<img src=\'/assets/uparrow.png\' style=\'width: 12px\'>&#160;' +
                 athlete.change +
                 '</p>');
      }
      else {
        memo += ('&#160;<img src=\'/assets/downarrow.png\' style=\'width: 12px\'>&#160;' +
                 athlete.change +
                 '</p>');
      }

      if (index !== array.length - 1) {
        memo += '<p>&#160;&#160;&#160;&#160;&#160</p>';
      }

      return memo;
    }, '');

  $('#top-player-ticker').html(tickerContent);

  setTimeout(getTopPlayers, POLL_INTERVAL);

      /*callback(null);
    },
    failure: function (response) {
      callback(new Error('Cannot get top players.'));
    }
  });*/
}

getDailyBoxscores();
getTopPlayers();