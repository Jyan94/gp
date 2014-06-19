require('rootpath')();
//var express = require('express');
//var app = module.exports = express();
var configs = require('config/index');
//configs.configure(app);

var cql = configs.cassandra.cql;
var client = configs.cassandra.client;
var request = require('request');
var xml2js = require('xml2js');
var parser = new xml2js.Parser();
var urlHelper = require('../libs/url_helper_mlb');
var async = require('async');
var Player = require('../libs/cassandra/baseballPlayer.js');
//app.use('/', require('../app.js'));
var Bet = require('../libs/cassandra/bet.js');
var User = require('../libs/cassandra/user.js');

var sportsdataMlb = require('sportsdata').MLB;

sportsdataMlb.init('t', 4, 'grnayxvqv4zxsamxhsc59agu', 2014, 'REG');

function createRequest(url, callback) {

    request(url, function (error, response, body) {

        if (!error && response.statusCode == 200) {

            // Parse the XML to JSON
            parser.parseString(body, function (err, result) {
                callback(err, result);
            });
        } else {
            console.log("code error: " + response.statusCode);
            callback(error, body);
        }
    });
}

function getPlayByPlay(event, callback) {
  var url = urlHelper.getPlayByPlayUrl(event);
  createRequest(url, callback);
}

function getPlayByPlayForGame(event, callback) {
  getPlayByPlay('000c465f-7c8c-46bb-8ea7-c26b2bc7c296', function(err, result) {
    var retArr = [];
    var prefixInning = result.play_by_play.inning
    var length = prefixInning.length;
    console.log(prefixInning[7].inning_half[1].at_bat[0].description);
    for (var i = length - 1; i >= 0; i--) {
      var currentHalves = prefixInning[i].inning_half
      var halvesLength = currentHalves.length
      for (var j = halvesLength - 1; j >= 0; j--) {
        if (currentHalves[j].at_bat !== undefined) {
          var atbatLength = currentHalves[j].at_bat.length;
          if (atbatLength > 0 ) {
            for (var k = atbatLength - 1; k >= 0; k--) {
              var description = result.play_by_play.inning[i].inning_half[j].at_bat[k].description;
              if (description !== undefined) {
                retArr.push(description[0]);
              }
            }
          }
        }
      }
    }
    callback(null, retArr);
  });
}

function getEventInfoAndLineups(event_id, callback) {
  var url = urlHelper.getEventInfoAndLineups(event_id);
  createRequest(url, callback);
}
/*
getEventInfoAndLineups('1c3275f1-1988-4937-8670-9562c024ec83', function (err, result) {
  console.log(result.event.scheduled_start_time[0]);
})
*/

function getDailyEventInfoAndLineups(year, month, day, callback) {
  var url = urlHelper.getDailyEventInfoAndLineups(year, month, day);
  createRequest(url, callback);
}

function getDailyBoxscore(year, month, day, callback) {
  var url = urlHelper.getDailyBoxscoreUrl(year, month, day);
  createRequest(url, callback);
}

function getNameAndScore(boxscore, callback) {
  var retVal;
  if (boxscore.$.status === 'scheduled') {
    getEventInfoAndLineups(boxscore.$.id, function(err, result) {
      if (result === undefined || !result.hasOwnProperty('event')) {
        console.log("adasda")
        setTimeout(function() {
          getNameAndScore(boxscore, callback);
        }, 10001)
      }
      else {
        var startTime = result.event.scheduled_start_time[0];
        retVal = {
          'homeName': boxscore.home[0].$.abbr,
          'visitorName': boxscore.visitor[0].$.abbr,
          'startTime': startTime
        }
      }
    })
  }
  else {
    retVal = {
      'homeName': boxscore.home[0].$.abbr,
      'homeScore': boxscore.home[0].$.runs,
      'visitorName': boxscore.visitor[0].$.abbr,
      'visitorScore': boxscore.visitor[0].$.runs
    }
  }
  console.log('retVal: ' + retVal);
  callback(null, retVal);
}

var getEachBoxScore = function(year, month, day, callback) {
  getDailyBoxscore(year, month, day, function(err, result) {
    async.map(result.boxscores.boxscore, getNameAndScore, function(err, result){
      if (err) {
        console.log(err);
      }
      else {
        callback(null, result);
      }
    });
  });
}

var calculateMlbFantasyPoints = function(playerObject, callback) {
  var playerId = playerObject.playerId; //player is id not name
  var isOnHomeTeam = playerObject.isOnHomeTeam;
  var gameId = playerObject.prefixSchedule.$.id
  var count = 0.0;

  sportsdataMlb.getGameStatistics(gameId, function(err, stats){
    if (!err) {
      if (stats === undefined || !stats.hasOwnProperty('statistics')) {
        setTimeout(function() {
          calculateMlbFantasyPoints(playerObject, callback);
        }, 1001);
      }
      else {
        var prefixHitting;
        var prefixPitching;
        if (isOnHomeTeam === true) {
          prefixHitting = stats.statistics.home[0].hitting[0].players[0].player;
          prefixPitching = stats.statistics.home[0].pitching[0].players[0].player;
        }
        else {
          prefixHitting = stats.statistics.visitor[0].hitting[0].players[0].player;
          prefixPitching = stats.statistics.visitor[0].pitching[0].players[0].player;
        }

        var length = prefixPitching.length;
        var bool = false;

        for (var j = 0; j < length; j++) {
          if (playerId === prefixPitching[j].$.id) {
            bool = true;

            if (prefixPitching[j].games[0].$.win === 1) {
              count = count + 7;
            }
            if (prefixPitching[j].games[0].$.loss ===1) {
              count = count - 5;
            }
/*
            console.log("ktotalP: " + prefixPitching[j].outs[0].$.ktotal);
            console.log("eraP: " + prefixPitching[j].runs[0].$.earned);
            console.log("hitsP: " + prefixPitching[j].onbase[0].$.h);
            console.log("bbP: " + prefixPitching[j].onbase[0].$.bb);
            console.log("hbpP: " + prefixPitching[j].onbase[0].$.hbp);
            console.log("ip_1P: " + prefixPitching[j].$.ip_1);
*/
            count = count + 0.5 *prefixPitching[j].outs[0].$.ktotal;
                          - prefixPitching[j].runs[0].$.earned;
                          - prefixPitching[j].onbase[0].$.h
                          - prefixPitching[j].onbase[0].$.bb
                          - prefixPitching[j].onbase[0].$.hbp;
                          + prefixPitching[j].$.ip_1;
            if (prefixPitching[j].runs[0].$.earned <= 3 && prefixPitching[j].$.ip_1 > 21) {
              count = count + 3;
            }
            if (prefixPitching[j].games[0].$.save === 1) {
              count = count + 5;
            }
          }
        }

        length = prefixHitting.length;
        for (var i = 0; i < length; i++) {
          if (playerId === prefixHitting[i].$.id && bool === false) {
            /*
            console.log("s: " + parseInt(prefixHitting[i].onbase[0].$.s));
            console.log("d: " + parseInt(2*prefixHitting[i].onbase[0].$.d));
            console.log("t: " + parseInt(3*prefixHitting[i].onbase[0].$.t));
            console.log("hr: " + parseInt(4*prefixHitting[i].onbase[0].$.hr));
            console.log("rbi: " + parseInt(prefixHitting[i].$.rbi));
            console.log("bb: " + parseInt(prefixHitting[i].onbase[0].$.bb));
            console.log("hbp: " + parseInt(prefixHitting[i].onbase[0].$.hbp));
            console.log("runs: " + parseInt(prefixHitting[i].runs[0].$.total));
            console.log("caught: " + parseInt(prefixHitting[i].steal[0].$.caught));
            console.log("strikeouts: " + parseInt(prefixHitting[i].outs[0].$.ktotal/2.0));
            console.log("stolen: " + parseInt(2*prefixHitting[i].steal[0].$.stolen));
*/
            count = parseInt(prefixHitting[i].onbase[0].$.s)
                    + parseInt(2*prefixHitting[i].onbase[0].$.d)
                    + parseInt(3*prefixHitting[i].onbase[0].$.t)
                    + parseInt(4*prefixHitting[i].onbase[0].$.hr)
                    + parseInt(prefixHitting[i].$.rbi)
                    + parseInt(prefixHitting[i].onbase[0].$.bb)
                    + parseInt(prefixHitting[i].onbase[0].$.hbp)
                    + parseInt(prefixHitting[i].runs[0].$.total)
                    - parseInt(prefixHitting[i].steal[0].$.caught)
                    - parseInt(prefixHitting[i].outs[0].$.ktotal/2.0)
                    + parseInt(2*prefixHitting[i].steal[0].$.stolen);
          }
        }
        callback(null, count);
      }
    }
    else {
      callback(err);
    }
  });
}

/*
getDailyEventInfoAndLineups('2014', '06', '11', function(err, result) {
  console.log(result.events.event[1].game[0].visitor[0].roster[0].player[2].$);
});
*/

function getAllPlayerIdForGame(prefixScheduleElement, callback) {
  var retArray = [];
  if (prefixScheduleElement.$.status === 'closed') {
    var result = prefixScheduleElement.game[0].home[0].roster[0].player;
    for (var i = 0; i < result.length; i++) {
      retArray.push({
        'name': result[i].$.preferred_name + " " + result[i].$.last_name,
        'playerId': result[i].$.id,
        'isOnHomeTeam': true,
        'prefixSchedule': prefixScheduleElement
      })
    }
    result = prefixScheduleElement.game[0].visitor[0].roster[0].player;
    for (var j = 0; j < result.length; j++) {
      retArray.push({
        'name': result[j].$.preferred_name + " " + result[j].$.last_name,
        'playerId': result[j].$.id,
        'isOnHomeTeam': false,
        'prefixSchedule': prefixScheduleElement
      })
    }
    callback(null, retArray);
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

function getAllFantasyPoints(playerObjects, callback) {

  async.map(playerObjects, calculateMlbFantasyPoints, function(err, result) {
    if (err) {
      console.log(err);
    }
    else {
      console.log("7");
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
      console.log("4");
      callback(null, result);
    }
  })
}

function getBets(playerObjects, fantasyPointsArray, callback) {
  var playerIdArr = [];
  console.log("5");
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
  console.log("1");
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
    console.log("2");
    for (var j = 0; j !== bets.length; ++j) {
      console.log("3");
      calculateBet(bets[j], fantasyPoints[i], errCallback);
    }
  }
}

function reduceMatrixToArray(matrix, year, week, day, retCallback) {
  async.reduce(matrix, [], function(memo, playerArray, callback) {
    for (var i = 0; i !== playerArray.length; ++i) {
      memo.push(playerArray[i]);
    }
    callback(null, memo);
  }, function (err, result) {
    retCallback(null, result, year, week, day);
  });
}

function calculateAllWinnings(schedule, year, week, day) {
  var prefixSchedule = schedule.events.event;

    async.waterfall([

      function(callback) {
        callback(null, prefixSchedule, year, week, day);
      },
      //first waterfall function, gets list of players and player_id
      getAllPlayerIds,
      //reduce matrix to single array
      reduceMatrixToArray,
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

exports.getEachBoxScore = getEachBoxScore;