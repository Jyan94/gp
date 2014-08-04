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
    url: '/marketHomeGames',
    type: 'GET',
    success: function (response) {
      var tickerContent = JSON.parse(response).reduce(function (memo, game, index, array) {
        if (['inprogress', 'closed'].indexOf(game.status) >= 0) {
          memo += ('<p>' + game.shortAwayName + ' ' + game.awayScore + ' ' + game.shortHomeName + ' ' + game.homeScore + '</p>');
        }
        else if (game.status === 'scheduled') {
          memo += ('<p>' + game.shortAwayName + ' at ' + game.shortHomeName + ' begins at ' + formatTime(game.startTime) + '</p>');
        }
        else {
          memo += ('<p>' + game.shortAwayName + ' at ' + game.shortHomeName + ' is ' + formatTime(game.startTime) + '</p>');
        }

        if (index !== array.length - 1) {
          memo += '<p> | </p>';
        }

        return memo;
      }, '');

      $('#marketHome-ticker').html(tickerContent);

      callback(null);
    },
    failure: function (response) {
      callback(new Error('Cannot get daily boxscores.'));
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