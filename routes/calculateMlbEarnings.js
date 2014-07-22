require('rootpath')();
//var express = require('express');
//var app = module.exports = express();
var configs = require('config/index');
//configs.configure(app);

var cql = configs.cassandra.cql;
var client = configs.cassandra.client;
var async = require('async');
var Player = require('../libs/cassandra/baseballPlayer.js');
var Bet = require('../libs/cassandra/bet.js');
var User = require('../libs/cassandra/user.js');
var calculate = require('../libs/applicationServer/calculateMlbFantasyPoints.js');
var mlbData = require('../libs/mlbData.js');

var sportsdataMlb = require('sportsdata').MLB;

sportsdataMlb.init('t', 4, 'grnayxvqv4zxsamxhsc59agu', 2014, 'REG');

/*takes in a schedule object and returns all the player ids for the home team
and away team for the particular game*/
function getAllPlayerIdForGame(prefixScheduleElement, callback) {
  var retArray = [];

  if (prefixScheduleElement.$.status === 'closed') {
    var result = prefixScheduleElement.game[0].home[0].roster[0].player;

    for (var i = 0; i < result.length; i++) {
      retArray.push({
        'name': result[i].$.preferred_name + " " + result[i].$.last_name,
        'athleteId': result[i].$.id,
        'isOnHomeTeam': true,
        'prefixSchedule': prefixScheduleElement
      })
    }

    result = prefixScheduleElement.game[0].visitor[0].roster[0].player;

    for (var j = 0; j < result.length; j++) {
      retArray.push({
        'name': result[j].$.preferred_name + " " + result[j].$.last_name,
        'athleteId': result[j].$.id,
        'isOnHomeTeam': false,
        'prefixSchedule': prefixScheduleElement
      })
    }

    callback(null, retArray);
  }
}

/* goes through all the games in a particular day and gets the athleteIds*/
function getAllPlayerIds(prefixSchedule, year, week, day, callback) {
  async.map(prefixSchedule, getAllPlayerIdForGame,
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

/* makes the formatting into an array of objects*/
function reduceMatrixToArray(matrix, year, week, day, retCallback) {
  console.log(matrix.length);
  async.reduce(matrix, [], function(memo, playerArray, callback) {
    for (var i = 0; i !== playerArray.length; ++i) {
      memo.push(playerArray[i]);
    }
    callback(null, memo);
  }, function (err, result) {
    console.log(result.length);
    retCallback(null, result);
  });
}


/* calculates the fantasy points all the players score by using
 calculateMlbFantasyPoints function which gets the fantasy point
 for a specific player*/
function getAllFantasyPoints(playerObjects, callback) {
  console.log(playerObjects);

  async.map(playerObjects, calculate.calculateMlbFantasyPoints,
    function(err, result) {
      console.log(result);
      if (err) {
        console.log(err);
      }
      else {
        console.log(result);
        callback(null, playerObjects, result);
      }
  });
}

/* gets all the bets on a specific player*/
function getBetsFromPlayerId (athleteId, callback) {
  Bet.selectUsingPlayerId('current_bets', athleteId, function(err, result) {
    if (err) {
      console.log(err);
    }
    else {
      callback(null, result);
    }
  })
}

/* gets the bets on all the players*/
function getBets(playerObjects, fantasyPointsArray, callback) {
  var athleteIdArr = [];

  for (var i = 0; i < playerObjects.length; i++) {
    athleteIdArr.push(playerObjects[i].athleteId);
  }

  async.map(athleteIdArr, getBetsFromPlayerId, function(err, result) {
    if (err) {
      console.log(err);
    }
    else {
      callback(null, result, fantasyPointsArray);
    }
  })
}

/* calculates the winnings for a better*/
function calculateBet(bet, fantasyPoints, callback) {
  var rows = bet;
  var longWinnings = rows.multiplier * (fantasyPoints - rows.bet_value);
  var shortWinnings = rows.multiplier * (rows.bet_value - fantasyPoints);

  console.log(longWinnings, rows);
  console.log(shortWinnings);

  User.updateMoney([longWinnings, shortWinnings],
    [rows.long_better_id, rows.short_better_id],
    function (err) {
      if (err) {
        console.log(err);
      }
      else {
        Bet.insertPast([rows.bet_id, rows.long_better_id, rows.short_better_id,
                        rows.athlete_id,
                        {value: parseFloat(rows.bet_value), hint: 'double'},
                        {value: parseFloat(rows.multiplier), hint: 'double'},
                        {value: parseFloat(longWinnings), hint: 'double'},
                        {value: parseFloat(shortWinnings), hint: 'double'},
                        rows.game_id, rows.expiration],
          function (err) {
            if (err) {
              console.log(err);
            }
            else {
              callback(null);
            }
        });
      }
  });
}

/* calculates all the winnings for all the players*/
function processArrayBets(betsArray, fantasyPoints, callback) {
  var errCallback = function(err) {
    if (err) {
      console.log(err);
    }
  };

  console.log(betsArray.length);
  for (var i = 0; i !== betsArray.length; ++i) {
    var bets = betsArray[i];

    console.log(bets.length);

    for (var j = 0; j !== bets.length; ++j) {
      calculateBet(bets[j], fantasyPoints[i], errCallback);
    }
  }
}


/*updates everyone's totals after a game is finished*/
function calculateAllWinnings(schedule, year, week, day) {
  var prefixSchedule = schedule.events.event;

  async.waterfall([

      function(callback) {
        callback(null, prefixSchedule, year, week, day);
      },
      //first waterfall function, gets list of players and athlete_id
      getAllPlayerIds,
      //reduce matrix to single array
      reduceMatrixToArray,
      //get all FantasyPoints associated with the players
      getAllFantasyPoints,
      //gets the bets on all the players(athletes)
      getBets,
      //gets the bets placed on the athletes and updates the user winnings
      processArrayBets
    ],
    function(err) {
      if (err) {
        console.log(err);
      }
    });
}

function checkEndGames(year, week, day) {
  mlbData.getDailyEventInfoAndLineups(year, week, day, function(err, schedule) {
    if (err) {
      console.log(err);
    }
    else {
      calculateAllWinnings(schedule, year, week, day);
    }
  });
}

function checkCurrentBets () {
  var date = new Date();
  var year = date.getFullYear();
  var month = date.getMonth() + 1;
  month = (month < 10 ? "0" : "") + month;
  var day = date.getDate();
  day = (day < 10 ? "0" : "") + day;

  console.log(year, month, day);
  checkEndGames(year, month, day);
}

checkEndGames(2014, '06', '22');

exports.getAllPlayerIdForGame = getAllPlayerIdForGame;
exports.getAllPlayerIds = getAllPlayerIds;
exports.reduceMatrixToArray = reduceMatrixToArray;
exports.getAllFantasyPoints = getAllFantasyPoints;
exports.getBetsFromPlayerId = getBetsFromPlayerId;
exports.getBets = getBets;
exports.calculateBet = calculateBet;
exports.processArrayBets = processArrayBets;
exports.calculateAllWinnings = calculateAllWinnings;
exports.checkEndGames = checkEndGames;
exports.checkCurrentBets = checkCurrentBets;