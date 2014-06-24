'use strict';
require('rootpath')();
var configs = require('config/index');

var cql = configs.cassandra.cql;
var client = configs.cassandra.client;

var async = require('async');

var Bet = require('libs/cassandra/bet.js');
var User = require('libs/cassandra/user.js');
var Player = require('libs/cassandra/baseballPlayer.js');
var TimeseriesBets = require('libs/cassandra/timeseriesBets');
var mlbData = require('libs/mlbData.js');
var BaseballStatistics = require('libs/cassandra/BaseballStatistics');
var SpendingPower = require('libs/calculateSpendingPower');

var defaultImage = configs.constants.defaultPlayerImage;

var getDailyScores = function(req, res, next) {
  var date = new Date();
  var year = date.getFullYear();
  var month = date.getMonth() + 1;
  month = (month < 10 ? "0" : "") + month;
  var day = date.getDate();
  day = (day < 10 ? "0" : "") + day;

  var gameDate = "" + year + "/" + month + "/" + day;
  console.log(gameDate);

  BaseballStatistics.selectGameUsingDate(gameDate, function(err, result) {
    if (err) {
      next(err);
    }
    else {
    res.render('marketHome', {result: result});
    }
  });
}

var getBetInfosFromPlayerId = function (req, res, next, callback) {
  var rows = null;
  var betInfo = [];

  Bet.selectUsingPlayerId('pending_bets', req.params.playerId,
    function(err, result) {
      if (err) {
        next(err);
      }
      else {
        rows = result;

        for (var i = 0; i < rows.length; i++) {
          betInfo[i] = {
            betId: rows[i].bet_id,
            longPosition: rows[i].long_position,
            betValue: rows[i].bet_value,
            multiplier: rows[i].multiplier
          }
        }

        callback(null, req, res, next, betInfo);
      }
    });
}

var getImageFromPlayerId = function (req, res, next, betInfo, callback) {
  var playerId = req.params.playerId;
  var fullName = null;
  var team;
  var position;

  Player.select(playerId, function(err, result) {
    if (err) {
      next(err);
    }
    else {
      fullName = result.full_name;
      team = result.team;
      position = result.position;

      Player.selectImagesUsingPlayerName(fullName, function(err, result) {
        if (result.length === 0) {
          res.render('market', {betinfo: betInfo,
            imageUrl: defaultImage,
            playerId: playerId,
            fullName: fullName,
            team: team,
            position: position});
        }
        else {
          res.render('market', {betinfo: betInfo,
            imageUrl: result[0].image_url,
            playerId: playerId,
            fullName: fullName,
            team: team,
            position: position});
        }
      });
    }
  });
}

var renderPlayerPage = function (req, res, next) {
  async.waterfall([
    function (callback) {
      callback(null, req, res, next);
    },
    getBetInfosFromPlayerId,
    getImageFromPlayerId,
    ],
    function (err) {
      if (err) {
        next(err);
      }
    });
}

//post to '/submitForm/:playerId'
var submitBet = function (req, res, next) {
  var betId = cql.types.timeuuid();
  var longPosition = null;

  if (req.body.longOrShort === 'Above') {
    longPosition = true;
  }
  else {
    longPosition = false;
  }

  SpendingPower.calculateSpendingPowerWithAddition(req.user.user_id,
    req.user.money,
    req.params.playerId,
    longPosition,
    parseFloat(req.body.price),
    parseFloat(req.body.shareNumber),
    function(err, result) {
    var spendingPower = result;
    console.log(spendingPower);
    if (spendingPower >= 0) {
    Bet.insertPending(
    [
    betId,
    req.user.user_id,
    longPosition,
    req.params.playerId,
    {value: parseFloat(req.body.price), hint: 'double'},
    {value: parseFloat(req.body.shareNumber), hint: 'double'},
    null,
    null
    ],
      function(err){
        if (err) {
          next(err);
        }
        else {
          SpendingPower.updateSpendingPower(req.user.user_id, req.user.money);
          res.redirect('/market/' + req.params.playerId)
        }
      });
    }
    else {
      next(new Error('Spending Power Too Low'));
    }
  })
}

var getBet = function (req, res, next, callback) {
  var betId = req.body.betId;

  Bet.selectMultiple('pending_bets', [betId],
    function(err, result) {
      if (err) {
        next(err);
      }
      else if (result.length === 0) {
        console.log('Bet Already Taken');
      }
      else {
        callback(null, req, res, next, result);
      }
    });
}

var insertBet = function (req, res, next, result, callback) {
  var currentBet = result[0];
  var longBetterId = null;
  var shortBetterId = null;

  if (currentBet.long_position === 'true') {
    longBetterId = currentBet.user_id;
    shortBetterId = req.user.user_id;
  }
  else {
    longBetterId = req.user.user_id;
    shortBetterId = currentBet.user_id;
  }

  SpendingPower.calculateSpendingPowerWithAddition(req.user.user_id,
  req.user.money,
  currentBet.player_id,
  currentBet.long_position,
  parseFloat(currentBet.multiplier),
  parseFloat(currentBet.bet_value),
  function(err, result) {
    var spendingPower = result;
    console.log(spendingPower);
    if (spendingPower >= 0) {
    Bet.insertCurrent(req.user.user_id, [currentBet.bet_id, longBetterId,
    shortBetterId, currentBet.player_id,
    {value: parseFloat(currentBet.bet_value), hint: 'double'},
    {value: parseFloat(currentBet.multiplier), hint: 'double'},
    currentBet.game_id, currentBet.expiration],
    function (err) {
      if (err) {
        next(err);
      }
      else {
        TimeseriesBets.insert(currentBet.player_id,
          parseFloat(currentBet.bet_value),
          function(err){
            if (err) {
              next(err);
            }
            else {
              SpendingPower.updateSpendingPower(req.user.user_id, req.user.money);
            }
          })
        }
      })
    }
    else {
      next(new Error('Spending Power too low'));
    }
  })
}

//post to '/addBets/:playerId'
var takeBet = function (req, res, next) {
  var currentBet = null;
  var longBetterId = null;
  var shortBetterId = null;

  async.waterfall([
    function (callback) {
      callback(null, req, res, next);
    },
    getBet,
    insertBet
    ],
    function (err) {
      if (err) {
        next(err);
      }
    });
}

//exports above functions
exports.renderPlayerPage = renderPlayerPage;
exports.submitBet = submitBet;
exports.takeBet = takeBet;
exports.getDailyScores = getDailyScores;