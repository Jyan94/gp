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
function calculateFantasyPointsForContest (contestId, callback) {
  DailyProphet.selectById(contestId, function(err, result) {
    var athletes = result.athletes;
    var playerObjectArr = [];
    for (var i = 0; i < athletes.length; i++) {
      var homeAbbr;
      var awayAbbr;
      var homeName;
      var awayName;
      if (athletes[i].isOnHomeTeam) {
        homeAbbr = athletes[i].shortTeamName;
        awayAbbr = athletes[i].shortVersusTeamName;
        homeName = athletes[i].longTeamName;
        awayName = athletes[i].longVersusTeamName;
      }
      else {
        homeAbbr = athletes[i].shortVersusTeamName;
        awayAbbr = athletes[i].shortTeamName;
        homeName = athletes[i].longVersusTeamName;
        awayName = athletes[i].longTeamName;
      }
      playerObjectArr.push({
        name: athletes[i].athleteName,
        playerId: athletes[i].athleteId,
        isOnHomeTeam: athletes[i].isOnHomeTeam,
        prefixSchedule: {
          '$': {
            id: athletes[i].gameId,
          },
          home: [
            {$: {
                abbr: homeAbbr,
                name: homeName
              }
            }
          ],
          visitor: [
            {$: {
                abbr: awayAbbr,
                name: awayName
              }
            }
          ]
        }
      });
    }
    async.map(playerObjectArr, calculate.calculateMlbFantasyPoints, function(err, result) {
      if (err) {
        callback(err);
      }
      else {
        callback(null, contestId, result);
      }
    });
  });
}

/* calculate the points in the tournament for all the contestants */
function calculatePoints (contestId, FantasyArray, callback) {
  var contestantPoints = [];

  DailyProphet.selectById(contestId, function(err, result) {
    var contestants = result.contestants;

    for (var contestant in contestants) {
      var contestantParsed = JSON.parse(contestants[contestant]).instances;

      for (var i = 0; i < contestantParsed.length; i++) {
        var wagers = contestantParsed[i].wagers;
        var predictions = contestantParsed[i].predictions;
        var contestantId = contestantParsed[i].userId;
        var totalPoints = 0.0;

        for (var j = 0; j < wagers.length; j++) {
          totalPoints = totalPoints + wagers[j] + wagers[j]/(Math.abs(predictions[j] - FantasyArray[j]) + 1);
          /*console.log(totalPoints);*/
        }
        contestantPoints.push({contestantId: contestantId, totalPoints: totalPoints});
      }
    }
    contestantPoints.sort(function(contestant1, contestant2) {
      return contestant1.totalPoints - contestant2.totalPoints;
    });
    callback(null, contestId, contestantPoints);
  });
}

/* calculate the actual dollar winnings for contestants depending on the prize
payouts in the contest*/
function calculateWinningsForContestant(contestId, contestantPoints, callback) {
  DailyProphet.selectById(contestId, function(err, result) {
    var payouts = result.pay_outs;
    function calculateWinningsForContestantHelper(integer, callback) {
      User.addMoneyToUser(payouts.pop(), contestantPoints[integer].contestantId, callback)
    }
    var contestArr = [];
    for (var i = contestantPoints.length - 1; i >= 0; i--) {
      contestArr.push(i);
    }
    async.each(contestArr, calculateWinningsForContestantHelper, function(err) {
      if (err) {
        callback(err);
      }
      else {
        //change state of contest to processed
        DailyProphet.setToProcess(contestId, function(err) {
          if (err) {
            callback(err);
          }
        })
      }
    })
  })
}

/* use the waterfall to update all the winnings for a particular contest*/
function calculateWinningsForContest (contests, callback) {
  async.waterfall([
    function(callback) {
      callback(null, contests);
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