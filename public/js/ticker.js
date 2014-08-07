var formatTime = function (oldTime) {
  var time = new Date(oldTime);
  var timeHalf = (time.getHours() > 11 ? ' PM' : ' AM');
  var timeString = (((time.getHours() + 11) % 12) + 1
                    + time.toTimeString().substring(2, 8)
                    + timeHalf);

  return timeString;
}

function getDailyBoxscores (callback) {
  $.ajax({
    url: '/marketHomeDailyBoxscores',
    type: 'GET',
    success: function (response) {
      var tickerContent = JSON.parse(response).reduce(function (memo, game, index, array) {
        var status = game.status;

        if (status === 'scheduled') {
          memo += ('<p>' + game.shortAwayName + ' at ' + game.shortHomeName + ' begins at ' + formatTime(game.startTime) + '</p>');
        }
        else if (status === 'closed') {
          memo += ('<p>' + game.shortAwayName + ' ' + game.awayScore + ' ' + game.shortHomeName + ' ' + game.homeScore + ' Current Inning: ' + game.currentInning + '</p>');
        }
        else if (status === 'inprogress') {
          memo += ('<p>' + game.shortAwayName + ' ' + game.awayScore + ' ' + game.shortHomeName + ' ' + game.homeScore + ' Final</p>');
        }
        else {
          memo += ('<p>' + game.shortAwayName + ' at ' + game.shortHomeName + ' is ' + formatTime(game.startTime) + '</p>');
        }

        if (index !== array.length - 1) {
          memo += '<p>&#160;&#160;&#160;&#160;&#160</p>';
        }

        return memo;
      }, '');

      $('#daily-boxscore-ticker').html(tickerContent);

      callback(null);
    },
    failure: function (response) {
      callback(new Error('Cannot get daily boxscores.'));
    }
  });
}

function getTopPlayers (callback) {
  $.ajax({
    url: '/marketHomeTopPlayers',
    type: 'GET',
    success: function (response) {
      var tickerContent = JSON.parse(response).reduce(function (memo, athlete, index, array) {
        console.log(athlete);
        memo += ('<p>' + (athlete.fullName ? athlete.fullName : athlete.athleteId) + ' ' + athlete.fantasyPoints[0]);

        if (athlete.change >= 0) {
          memo += ('<img src=\'/assets/uparrow.png\'>' + athlete.change + '</p>');
        }
        else {
          memo += ('<img src=\'/assets/downarrow.png\'>' + athlete.change + '</p>');
        }

        if (index !== array.length - 1) {
          memo += '<p>&#160;&#160;&#160;&#160;&#160</p>';
        }

        return memo;
      }, '');

      $('#top-player-ticker').html(tickerContent);

      callback(null);
    },
    failure: function (response) {
      callback(new Error('Cannot get top players.'));
    }
  });
}

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

customSetInterval(getDailyBoxscores, 60000);
customSetInterval(getTopPlayers, 60000);