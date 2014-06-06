require('rootpath')();
var express = require('express');
var app = module.exports = express();
var configs = require('config/index');
configs.configure(app);

var cql = configs.cassandra.cql;
var client = configs.cassandra.client;

app.use('/', require('../app.js'));

var User = require('../libs/cassandra/user.js');
var Bet = require('../libs/cassandra/bet.js');
var Player = require('../libs/cassandra/player.js');
var calculate = require('../libs/calculateFantasyPoints.js');
var sportsdata_nfl = require('sportsdata').NFL;
var sportsdata_mlb = require('sportsdata').MLB;
var async = require('async');

sportsdata_nfl.init('t', 1, 'gzjpc3dseum9ps25td2y6mtx', 2013, 'REG');
sportsdata_mlb.init('t', 4, 'f8rhpkpxsxdvhzrr3vmxn8wk', 2014, 'REG');

//result returned:
/**
 * [
 *  { 'name': player1name, 'id': player1id, 'isOnHomeTeam': [bool] }
 *  { 'name': player2name, 'id': player2id, 'isOnHomeTeam': [bool] }
 *  ...
 * ]
 */
function findClosedSchedulesAndPlayers(prefixSchedElement, callback) {
  var retArray = [];
  var hometeam = prefixSchedElement.$.home;
  var awayteam = prefixSchedElement.$.away;
  if (prefixSchedElement.$.status === 'closed') {
    async.waterfall([

      //pushes on the home players
      function (callback) {
        Player.selectUsingTeam(hometeam,
          function (err, result) {
            if (err) {
              console.log(err);
            } else {
              for (var i = 0; i < result.rows.length; i++) {
                retArray.push({
                  'name': result.rows[i].full_name,
                  'id': result.rows[i].player_id,
                  'isOnHomeTeam': true
                });
              }
              callback(null, retArray);
            }
          });
      },

      //pushes on the away players
      function (arr, callback) {
        Player.selectUsingTeam(awayteam,
          function(err, result) {
            if (err) {
              console.log(err);
            } else {
              for (var i = 0; i < result.rows.length; i++) {
                arr.push({
                  'name': result.rows[i].full_name,
                  'id': result.rows[i].player_id,
                  'isOnHomeTeam': false
                });
              }
              callback(null, arr);
            }
          });
      }
      ], function (err, result) {
        callback(null, retArray);
      });
  }
}

function getBetsFromPlayerId(player_id, callback) {
  Bet.selectUsingPlayerID('current_bets', [player_id], function (err, result) {
      if (err) {
        console.log(err);
      } else {
        //returns a list of bets
        callback(null, result);
      }
  });
}

/**
 * takes a betId and a fantasy point value and updates a user's wallet
 * @param  {uuid}   betId
 * @param  {double}   fantasyPoints [single fantasy point value]
 * @param  {Function} callback
 */
function calculateBet(bet, fantasyPoints, callback) {
  var rows = bet;
  var longWinnings = rows.multiplier * (fantasyPoints - rows.bet_value);
  var shortWinnings = rows.multiplier * (rows.bet_value - fantasyPoints);
  console.log(longWinnings);
  console.log(shortWinnings);
  User.updateCash([longWinnings, shortWinnings], [rows.long_better_id, rows.short_better_id],
    function(err) {
      if (err) {
        console.log(err);
      } else {
        callback(null);
      }
  });
}

//Waterfall functions start here

//first waterfall function
//gets list of players + player_id
function getPlayers(prefixSchedule, year, week, callback) {
  async.map(
    prefixSchedule,
    findClosedSchedulesAndPlayers,
    //result here is an array of objects specified by return value of
    //findClosedSchedulesAndPlayer function
    function(err, result) {
      if (err) {
        console.log(err);
      } else {
        callback(null, result, prefixSchedule, year, week);
      }
    });
}

function getBetIds(players, prefixSchedule, year, week, callback) {
  var mapArray = [];
  var playerIds = [];
  for (var i = 0; i !== players.length; i++) {
    mapArray.push({
      'player': players[i].name,
      'prefixSchedule': prefixSchedule,
      'isOnHomeTeam': players[i].isOnHomeTeam,
      'year': year,
      'week': week
    });
    playerIds.push(players[i].id);
  }
  //returns an array of fantasy points as result
  //matches playerIds array
  async.map(mapArray, calculate.calculateFantasyPoints, function (err, result) {
    if (err) {
      console.log(err);
    } else {
      callback(null, playerIds, result);
    }
  });
}

function getBetsPlayerId(playerIds, fantasyPointsArray, callback) {
  async.map(playerIds, getBetsFromPlayerId, function (err, result) {
    //result is an array of bet arrays
    if (err) {
      console.log(err);
    } else {
      callback(null, result, fantasyPointsArray);
    }
  });
}

/**
 * [processArrayBets description]
 * @param  {[type]}   betArray
 * @param  {[type]}   fantasyPoints
 * @param  {Function} callback
 * @return {[type]}
 */
//betArray is an array of arrays
//the index of each entry in fantasyPoints corresponds to an array of bets
//in betsArray
function processArrayBets(betsArray, fantasyPoints, callback) {
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

function calculateAllFantasyPoints(schedule, year, week) {
  var prefixSchedule = schedule.games.game;
  async.waterfall([
    //starts off chain
    function (callback) {
      callback(null, prefixSchedule, year, week);
    },
    //first waterfall function
    //gets list of players + player_id
    getPlayers,
    //second waterfall function
    //get all bet ids associated with player
    //result.rows is list of players and player_id queried from database
    getBetIds,
    //third waterfall function
    //get all bet ids corresponding to given player id
    getBetsPlayerId,
    //fourth waterfall function
    processArrayBets
    ], 
    function (err) {
      if (err) {
        console.log(err);
      }
    });
}

var checkEndGames = function(year, week) {
  var rows;
  sportsdata_nfl.getWeeklySchedule(1, function(err, schedule) {
    if (err) {
      console.log(err);
    } else {
      calculateAllFantasyPoints(schedule, year, week);
    }
  });
};

checkEndGames(2013, 6);
//async.map schedules -> closed schedules
//async.map closed schedules -> player objects
//async.each player objects -> get bets and update
app.listen(3000);

//tests
//for calculating fantasy points
/*calculate.calculateFantasyPoints('Andre Johnson', 'HOU', 'SD', false, '2013', 1, function(err, result) {
  if (err) {
    console.log(err);
    return;
  }
  console.log(result);
});*/
