'use strict';
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
var Player = require('libs/applicationServer/cassandra/footballPlayer.js');
var calculate = require('libs/applicationServer/calculateNflFantasyPoints.js');
var sportsdataNfl = require('sportsdata').NFL;
var sportsdataMlb = require('sportsdata').MLB;
var async = require('async');

sportsdataNfl.init('t', 1, 'rmbgzsxq9n4j2yyqx4g6vafy', 2013, 'REG');
sportsdataMlb.init('t', 4, 'f8rhpkpxsxdvhzrr3vmxn8wk', 2014, 'REG');

//result returned:
/**
 * [
 *  { 'name': player1name, 'id': player1id, 'isOnHomeTeam': [bool] }
 *  { 'name': player2name, 'id': player2id, 'isOnHomeTeam': [bool] }
 *  ...
 * ]
 */
function findClosedSchedulesAndPlayers(prefixSchedElement, callback) {
  console.log(prefixSchedElement);
  var retArray = [];
  var homeTeam = prefixSchedElement.$.home;
  var awayTeam = prefixSchedElement.$.away;
  if (prefixSchedElement.$.status === 'closed') {
    async.waterfall([

      //pushes on the home players
      function (callback) {
        Player.selectUsingTeam(homeTeam,
          function (err, result) {
            if (err) {
              console.log(err);
            }
            else {
              for (var i = 0; i < result.length; i++) {
                retArray.push({
                  'name': result[i].full_name,
                  'id': result[i].athlete_id,
                  'isOnHomeTeam': true,
                  'prefixSchedule': prefixSchedElement
                });
              }
              callback(null, retArray);
            }
          });
      },

      //pushes on the away players
      function (arr, callback) {
        Player.selectUsingTeam(awayTeam,
          function(err, result) {
            if (err) {
              console.log(err);
            }
            else {
              for (var i = 0; i < result.length; i++) {
                arr.push({
                  'name': result[i].full_name,
                  'id': result[i].athlete_id,
                  'isOnHomeTeam': false,
                  'prefixSchedule': prefixSchedElement
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

function getBetsFromPlayerId(athleteId, callback) {
  Bet.selectUsingPlayerId('current_bets', athleteId,
    function (err, result) {
      if (err) {
        console.log(err);
      }
      else {
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

//Waterfall functions start here

//first waterfall function
//gets list of players + athlete_id
function getPlayers(prefixSchedule, year, week, callback) {
  async.map(
    prefixSchedule,
    findClosedSchedulesAndPlayers,
    //result here is an array of objects specified by return value of
    //findClosedSchedulesAndPlayer function
    function(err, result) {
      if (err) {
        console.log(err);
      }
      else {
        callback(null, result, year, week);
      }
    });
}

function getBetIds(players, year, week, callback) {
  console.log(players);
  var mapArray = [];
  var athleteIds = [];
  var currentGame = null;
  var currentPlayer = null;

  for (var i = 0; i !== players.length; i++) {
    currentGame = players[i];

    for (var j = 0; j !== players[i].length; i++) {
      currentPlayer = currentGame[j];

      mapArray.push({
        'player': currentPlayer.name,
        'prefixSchedule': currentPlayer.prefixSchedule,
        'isOnHomeTeam': currentPlayer.isOnHomeTeam,
        'year': year,
        'week': week
      });
      athleteIds.push(currentPlayer.id);
    }
  }
  //returns an array of fantasy points as result
  //matches athleteIds array
  console.log(mapArray);
  async.map(mapArray, calculate.calculateNflFantasyPoints,
    function (err, result) {
      if (err) {
        console.log(err);
      } else {
        callback(null, athleteIds, result);
      }
    });
}

function getBetsPlayerId(athleteIds, fantasyPointsArray, callback) {
  async.map(athleteIds, getBetsFromPlayerId,
    function (err, result) {
      //result is an array of bet arrays
      if (err) {
        console.log(err);
      }
      else {
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

  console.log(betsArray, fantasyPoints);

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
    //gets list of players + athlete_id
    getPlayers,
    //second waterfall function
    //get all bet ids associated with player
    //result.rows is list of players and athlete_id queried from database
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

function checkEndGames(year, week) {
  var rows;
  sportsdataNfl.getWeeklySchedule(week, function(err, schedule) {
    if (err) {
      console.log(err);
    }
    else {
      calculateAllFantasyPoints(schedule, year, week);
    }
  });
}

exports.findClosedSchedulesandPlayers = findClosedSchedulesAndPlayers;
exports.getBetsFromPlayerId = getBetsFromPlayerId;
exports.calculateBet = calculateBet;
exports.getPlayers = getPlayers;
exports.getBetIds = getBetIds;
exports.getBetsPlayerId = getBetsPlayerId;
exports.processArrayBets = processArrayBets;
exports.calculateAllFantasyPoints = calculateAllFantasyPoints;
exports.checkEndGames = checkEndGames;


checkEndGames(2013, 1);
//async.map schedules -> closed schedules
//async.map closed schedules -> player objects
//async.each player objects -> get bets and update
//app.listen(3000);

//sportsdata_nfl.getWeeklySchedule(1, function(err, schedule) {
  //console.log(JSON.stringify(schedule));
//});

//sportsdata_nfl.getGameStats(1, 'BAL', 'DEN', function(err, schedule) {
  //console.log(JSON.stringify(schedule));
//});
//tests
//for calculating fantasy points
/*calculate.calculateNflFantasyPoints('Andre Johnson', 'HOU', 'SD', false,
'2013', 1,
function(err, result) {
  if (err) {
    console.log(err);
    return;
  }
  console.log(result);
});*/
