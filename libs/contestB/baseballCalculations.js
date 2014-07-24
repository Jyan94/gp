require('rootpath')();
//var express = require('express');
//var app = module.exports = express();
var configs = require('config/index');
//configs.configure(app);

var cql = configs.cassandra.cql;
var client = configs.cassandra.client;
var async = require('async');
var Player = require('libs/cassandra/baseballPlayer.js');
var User = require('libs/cassandra/user.js');
var Game = require('libs/cassandra/baseball/game.js');
var calculate = require('libs/applicationServer/calculateMlbFantasyPoints.js');
var mlbData = require('libs/mlbData.js');
var DailyProphet = require('libs/cassandra/contestB/exports.js');

var sportsdataMlb = require('sportsdata').MLB;

sportsdataMlb.init('t', 4, 'grnayxvqv4zxsamxhsc59agu', 2014, 'REG');

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
                callback(null, (statistics ? JSON.parse(statistics[game.game_date]).fantasyPoints : 0));
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
      weightedPrediction = (20 * predictions[i]) / fantasyArray[i];
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

  async.map(Object.keys(contestants),
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

function calculateWinningsForContestantHelper(contestantPoints, payouts) {
  return function (contestantPoint, callback) {
    var index = contestantPoints.indexOf(contestantPoint);

    User.addMoneyToUserUsingUsername(payouts[index],
      contestantPoints[index].username,
      function (err) {
        callback(err);
      })
  };
}

/* calculate the actual dollar winnings for contestants depending on the prize
payouts in the contest*/
/* TODO: SOLVE TIES */
function calculateWinningsForContestant(contest, contestantPoints, callback) {
  var payouts = contest.payouts;
  var contestantPointsSorted = contestantPoints.sort(function (a, b) {
    return b.totalPoints - a.totalPoints;
  });

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
