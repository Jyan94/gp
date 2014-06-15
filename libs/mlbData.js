require('rootpath')();
var express = require('express');
var app = module.exports = express();
var configs = require('config/index');
configs.configure(app);

var cql = configs.cassandra.cql;
var client = configs.cassandra.client;
var request = require('request');
var xml2js = require('xml2js');
var parser = new xml2js.Parser();
var urlHelper = require('../libs/url_helper_mlb');
var async = require('async');
var Player = require('../libs/cassandra/player.js');
app.use('/', require('../app.js'));
var Bet = require('../libs/cassandra/bets.js');
var User = require('../libs/cassandra/user/js');

var sportsdataMlb = require('sportsdata').MLB;

sportsdataMlb.init('t', 4, 'f8rhpkpxsxdvhzrr3vmxn8wk', 2014, 'REG');

function createRequest(url, callback) {

    request(url, function (error, response, body) {

        if (!error && response.statusCode == 200) {

            // Parse the XML to JSON
            parser.parseString(body, function (err, result) {
                callback(err, result);
            });
        } else {
            callback(error, body);
        }
    });
}

/*
function getGameStatistics(event, callback) {
  var url = urlHelper.getGameStatisticsUrl(event);
  createRequest(url, callback);
}

getGameStatistics('097b2e74-75a9-4fa2-86a8-0dce732751b0', function(err, result) {
  if (err) {
    console.log(err);
  }
  else {
    console.log(result.statistics.home[0].hitting[0].players[0].player[0])
  }
})

function calculateFantasyPoints(playerId) {

}
*/
/*
calculateMlbFantasyPoints = function(playerObject, callback) {
  var playerId = playerObject.playerId; //player is id not name
  var isOnHomeTeam = playerObject.isOnHomeTeam;
  var gameId = playerObject.prefixSchedule.$.id
  var count;

  sportsdataMlb.getGameStatistics(gameId, function(err, stats){
    if (!err) {
      if (isOnHomeTeam === true) {
        var prefixHitting = stats.statistics.home[0].hitting[0].players[0].player;
        var length = prefixHitting.length;
        for (var i = 0; i < length; i++) {
          if (playerId === prefixHitting[i].id) {
            count = count + prefixHitting[i].tb
                          + prefixHitting[i].rbi
                          + prefixHitting[i].onbase.bb
                          + prefixHitting[i].runs.total
                          - prefixHitting[i].steal.caught
                          + 2 * prefixHitting[i].steal.stolen;
          }
        }
        var prefixPitching = stats.statistics.home[0].pitching[0].players[0].player;
        length = prefixHitting.length;
        for (var j = 0; j < length; j++) {
          if (playerId === prefixPitching[j].id && prefixPitching[j].games.start == 1) {
            var tempCount;
            if (prefixPitching[j].runs.earned == 0) {
              tempCount = 7;
            }
            else if (prefixPitching[j].runs.earned == 1) {
              tempCount = 5;
            }
            else if (prefixPitching[j].runs.earned == 2) {
              tempCount = 3;
            }
            else if (prefixPitching[j].runs.earned == 3) {
              tempCount = 2;
            }
            else if (prefixPitching[j].runs.earned == 4) {
              tempCount = 1;
            }
            else {
              tempCount = 0;
            }
            count = count + tempCount;

            var tempCountK;
            if (prefixPitching[j].outs.ktotal <= 5) {
              tempCountK = 0;
            }
            else if (prefixPitching[j].outs.ktotal <= 7) {
              tempCountK = 1;
            }
            else if (prefixPitching[j].outs.ktotal <= 9) {
              tempCountK = 2;
            }
            else if (prefixPitching[j].outs.ktotal <= 12) {
              tempCountK = 3;
            }
            else if (prefixPitching[j].outs.ktotal <= 15) {
              tempCountK = 5;
            }
            else if (prefixPitching[j].out.ktotal <= 19) {
              tempCountK = 7;
            }
            else {
              tempCountK = 10;
            }

            count = count + tempCountK;

            var tempCountHS;
            var hittingAndWalks = prefixPitching[j].onbase.h + prefixPitching[j].onbase.bb;
            if (hittingAndWalks == 0) {
              tempCountHS = 20;
            }
            else if (hittingAndWalks == 1) {

            }

            count = count + 3*prefixPitching[j].games.win;

            count = count +

          }
        }
      }
    }
  })
}
*/

function getDailyEventInfoAndLineups(year, month, day, callback) {
  var url = urlHelper.getDailyEventInfoAndLineups(year, month, day);
  createRequest(url, callback);
}

getDailyEventInfoAndLineups('2014', '06', '11', function(err, result) {
  console.log(result.events.event[1].game[0].visitor[0].roster[0].player[2].$);
});

function getAllPlayerIdForGame(prefixScheduleElement, callback) {
  var retArray = [];
  if (prefixScheduleElement.$.status === 'closed') {

    var result = prefixScheduleElement.game[0].home[0].lineup[0].player;
    for (var i = 0; i < result.length; i++) {
      retArray.push({
        'name': result[i].preferred_name + " " + result[i].last_name,
        'playerId': result[i].player_id,
        'isOnHomeTeam': true,
        'prefixSchedule': prefixScheduleElement
      })
    }
    result = prefixScheduleElement.game[0].visitor[0].lineup[0].player;
    for (var j = 0; j < result.length; j++) {
      retArray.push({
        'name': result[j].preferred_name + " " + result[j].last_name,
        'plyaerId': result[j].player_id,
        'isOnHomeTeam': false,
        'prefixSchedule': prefixScheduleElement
      })
    }
  }
}


function getAllPlayerIds(prefixSchedule, year, week, day, callback) {
  async.map(
    prefixSchedule,
    getAllPlayerIdForGame,
    function(err, result) {
      if (err) {
        console.log(err);
      }
      else {
        callback(null, result, year, week, day);
      }
    }
  );
}

/**
 * [getBetIds description]
 * @param  array     players    array of players
 * @param  {[type]}   year     [description]
 * @param  {[type]}   week     [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */

function getAllFantasyPoints(playerObjects, callback) {
  async.map(playerObjects, calculateMlbFantasyPoints, function(err, result) {
    if (err) {
      console.log(err);
    }
    else {
      callback(null, playerObjects, result);
    }
  })
}

function getBetsFromPlayerId (playerId, callback) {
  Bet.selectUsingPlayerId('current_bets', playerId, function(err, result) {
    if (err) {
      console.log(err);
    }
    else {
      callback(null, result);
    }
  })
}

function getBets(playerObjects, fantasyPointsArray, callback) {
  var playerIdArr = [];
  for (var i = 0; i < playerObjects.length; i++) {
    playerIdArr.push(playerObjects.playerId);
  }
  async.map(playerIdArr, getBetsFromPlayerId, function(err, result) {
    if (err) {
      console.log(err);
    }
    else {
      callback(null, result, fantasyPointsArray);
    }
  })
}

function calculateBet(bet, fantasyPoints, callback) {
  var rows = bet;
  var longWinnings = rows.multiplier * (fantasyPoints - rows.bet_value);
  var shortWinnings = rows.multiplier * (rows.bet_value - fantasyPoints);
  console.log(longWinnings);
  console.log(shortWinnings);
  User.updateMoney([longWinnings, shortWinnings],
    [rows.long_better_id, rows.short_better_id],
    function(err) {
      if (err) {
        console.log(err);
      }
      else {
        callback(null);
      }
  });
}

function processArrayBets(betsArray, fantasyPoints) {
var errCallback = function(err) {
    if (err) {
      console.log(err);
    }
  };

  for (var i = 0; i !== betsArray.length; ++i) {
    var bets = betsArray[i];
    for (var j = 0; j !== bets.length; ++j) {
      calculateBet(bets[j], fantasyPoints[i], errCallback);
    }
  }
}

function calculateAllWinnings(schedule, year, week, day) {
  var prefixSchedule = schedule.events.event;

    async.waterfall([

      function(callback) {
        callback(null, prefixSchedule, year, week);
      },
      //first waterfall function, gets list of players and player_id
      getAllPlayerIds,
      //get all FantasyPoints associated with the players
      getAllFantasyPoints,

      getBets,

      processArrayBets
    ],
    function(err) {
      if (err) {
        console.log(err);
      }
    }

  )
}

function checkEndGames(year, week, day) {
  getDailyEventInfoAndLineups(year, week, day, function(err, schedule) {
    if (err) {
      console.log(err);
    }
    else {
      calculateAllWinnings(schedule, year, week, day);
    }
  })
}