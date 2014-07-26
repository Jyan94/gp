require('rootpath')();
//var express = require('express');
//var app = module.exports = express();
var configs = require('config/index');
//configs.configure(app);

var cql = configs.cassandra.cql;
var client = configs.cassandra.client;
var async = require('async');
var Player = require('libs/cassandra/baseball/player.js');
var User = require('libs/cassandra/user.js');
var Game = require('libs/cassandra/baseball/game.js');
var calculate = require('libs/applicationServer/calculateMlbFantasyPoints.js');
var DailyProphet = require('libs/cassandra/contestB/exports.js');

/* if the game is over, calculate all the fantasy points for the athletes in
a specific contest */
function calculateFantasyPointsForContest (contest, callback) {
  async.map(contest.athletes,
    function (athlete, callback) {
      var athleteParsed = JSON.parse(athlete);
      var statistics = null;

      Game.select(athleteParsed.gameId,
        function (err, game) {
          if (err) {
            callback(err);
          }
          else {
            Player.select(athleteParsed.athleteId, function (err, result) {
              if (err) {
                callback(null, 0);
              }
              else {
                statistics = result.statistics;
                callback(null, (statistics ? statistics[game.game_date].fantasyPoints : 0));
              }
            });
          }
      })
    },
    function(err, fantasyArray) {
      callback(err, contest, fantasyArray);
    });
}

function calculatePointsInstance(username, fantasyArray) {
  return function (instance, callback) {
    var totalPoints = 0.0;
    var predictions = instance.predictions;
    var wagers = instance.wagers;
    var weightedPrediction = 0.0;

    for (var i = 0; i < predictions.length; i++) {
      weightedPrediction = (20 * (predictions[i] + 10)) / (fantasyArray[i] + 10);
      totalPoints += (wagers[i] + wagers[i]/(Math.abs(weightedPrediction - 20) + 1));
    }

    callback(null, { username: username, totalPoints: totalPoints });
  }
}

function combineArray (array, callback) {
  async.reduce(array, [],
    function (memo, item, callback) {
      callback(null, memo.concat(item));
    },
    function (err, result) {
      callback(err, result);
    });
}

/* calculate the points in the tournament for all the contestants */
function calculatePoints (contest, fantasyArray, callback) {
  var contestants = contest.contestants;

  async.map((contestants ? Object.keys(contestants) : []),
    function (username, callback) {
      async.map(JSON.parse(contestants[username]).instances,
        calculatePointsInstance(username, fantasyArray),
        function (err, instances) {
          callback(err, instances);
        });
    },
    function (err, result) {
      combineArray(result, function (err, contestantPoints) {
        callback(err, contest, contestantPoints);
      });
    });
}

function breakTies (contestantPoints, payouts) {
  var firstRepeat = -1;
  var firstRepeatIndex = -1;
  var newPayout = 0;

  if (payouts.length > contestantPoints.length) {
    payouts.length = contestantPoints.length
  }

  if (payouts.length > 0) {
    firstRepeat = contestantPoints[0].totalPoints;
    firstRepeatIndex = 0;

    for (var i = 1; i < payouts.length; i++) {
      if (contestantPoints[i].totalPoints !== firstRepeat) {
        newPayout = 0;

        for (var j = firstRepeatIndex; j < i; j++) {
          newPayout += payouts[j];
        }

        newPayout = newPayout / (i - firstRepeatIndex);

        for (var j = firstRepeatIndex; j < i; j++) {
          payouts[j] = newPayout;
        }

        firstRepeat = contestantPoints[i].totalPoints;
        firstRepeatIndex = i;
      }
    }

    while ((i < contestantPoints.length)
           && (contestantPoints[i].totalPoints === firstRepeat)) {
      i += 1;
    }

    newPayout = 0;

    for (var j = firstRepeatIndex; j < payouts.length; j++) {
      newPayout += payouts[j];
    }

    newPayout = newPayout / (i - firstRepeatIndex);

    for (var j = firstRepeatIndex; j < i; j++) {
      payouts[j] = newPayout;
    }
  }

  return payouts;
}

function calculateWinningsForContestantHelper(contestantPoints, payouts) {
  return function (contestantPoint, callback) {
    var index = contestantPoints.indexOf(contestantPoint);

    User.addMoneyToUserUsingUsername(payouts[index] ? payouts[index] : 0,
      contestantPoints[index].username,
      function (err) {
        callback(err);
      });
  };
}

/* calculate the actual dollar winnings for contestants depending on the prize
payouts in the contest*/
function calculateWinningsForContestant(contest, contestantPoints, callback) {
  var payouts = contest.payouts;
  var newPayout = 0;
  var firstRepeat = -1;
  var firstRepeatIndex = -1;

  contestantPoints.sort(function (a, b) { return b.totalPoints - a.totalPoints; });

  payouts = breakTies(contestantPoints, payouts);

  async.each(contestantPoints,
    calculateWinningsForContestantHelper(contestantPoints, payouts),
    function (err) {
      if (err) {
        callback(err);
      }
      else {
        DailyProphet.setProcessed(contest.contest_id,
          function(err) {
            callback(err);
          });
      }
    });
}

/* use the waterfall to update all the winnings for a particular contest*/
function calculateWinningsForContest (contest, callback) {
  async.waterfall([
    function(callback) {
      callback(null, contest);
    },
    calculateFantasyPointsForContest,
    calculatePoints,
    calculateWinningsForContestant
    ],
    function(err) {
      callback(err);
    });
}

exports.calculateWinningsForContest = calculateWinningsForContest;
