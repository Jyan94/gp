/**
 * ====================================================================
 * Author: Harrison Zhao
 * ====================================================================
 */
'use strict';
(require('rootpath')());

var configs = require('config/index.js');
var cql = configs.cassandra.cql;
var async = require('async');
var User = require('libs/cassandra/user');
var ContestA = require('libs/cassandra/contestA/exports');
var UpdateBet = ContestA.UpdateBet;
var Timeseries = ContestA.Timeseries;
var BetHistory = ContestA.BetHistory;

var sportNames = configs.constants.sportNames;
var BASEBALL = sportNames.baseball;
var BASKETBALL = sportNames.basketball;
var FOOTBALL = sportNames.football;
var athletes = configs.globals.athletes;
var Games = require('libs/games/exports');
 
var constants = configs.constants;
var APPLIED = constants.cassandra.APPLIED;

//need to verify gameId and athlete in game!!!
//once a game is closed and the cache says so as well,
//no more bets can be made for that game, and the calculation
//script will go through all bets for that game
//ISSUE: Once time goes past 12 AM ET, no bets can be placed
//on games from the previous day, even if they are still in progress
//Perhaps refactor? Does not just check athlete information mismatch
function verifyGameIdAndAthlete(
  athleteId,
  athleteImage,
  athleteName,
  athletePosition,
  athleteTeam,
  gameId,
  sport,
  callback) {
  if (configs.isDev() && false) {
    callback(null);
  }
  else {
    var verify = function(idMap, list) {
      if (Games.Select.getGameIdByLongTeamName(athleteTeam) === gameId) {
        var athleteObj = list[idMap[athleteId]];
        var gameObj = Games.Select.getGameById(gameId);
      
        //Extra checks in place to prevent race conditions
        return (athleteObj.image === athleteImage &&
          athleteObj.fullName === athleteName &&
          athleteObj.position === athletePosition &&
          athleteObj.longTeamName === athleteTeam &&
          typeof(gameObj) !== 'undefined' &&
          gameObj.id === gameId &&
          gameObj.status !== 'closed' &&
          athleteObj.sport === sport);
      }
      else {
        return false
      }
    }
    switch(sport) {
      case FOOTBALL:
        verify(athletes.footballIdMap, athletes.footballList) ?
          callback(null) :
          callback(new Error('create pending: athlete information mismatch'));
        break;
      case BASEBALL:
        verify(athletes.baseballIdMap, athletes.baseballList) ?
          callback(null) :
          callback(new Error('create pending: athlete information mismatch'));
        break;
      case BASKETBALL:
        verify(athletes.basketballIdMap, athletes.basketballList) ?
          callback(null) :
          callback(new Error('create pending: athlete information mismatch'));
        break;
    }
  }
}

/**
  info fields:

  athleteId,
  athleteImage,
  athleteName,
  athletePosition,
  athleteTeam,
  expirationTimeMinutes,
  fantasyValue,
  gameId,
  isOverBettor,
  sport,
  wager
 * @param  {object}   info
 * @param  {object}   user
 * from req.user, must have username field
 * @param  {Function} callback
 * args: err
 */
function insertPending(info, user, callback) {
  var fantasyValue = parseFloat(info.fantasyValue);
  var wager = parseFloat(info.wager);
  var isOverBettor = (info.isOverBettor === 'true');

  async.waterfall(
  [
    function(callback) {
      verifyGameIdAndAthlete(
        info.athleteId,
        info.athleteImage,
        info.athleteName,
        info.athletePosition,
        info.athleteTeam,
        info.gameId,
        info.sport,
        callback);
    },
    function(callback) {
      User.subtractMoney(user.money, wager, user.user_id, callback);
    },
    function(callback) {
        UpdateBet.insertPending(
        info.athleteId,
        info.athleteImage,
        info.athleteName,
        info.athletePosition,
        info.athleteTeam,
        cql.types.timeuuid(),
        info.expirationTimeMinutes,
        fantasyValue,
        info.gameId,
        isOverBettor,
        info.sport,
        user.username,
        wager,
        callback);
    }
  ], callback);
}

/*
   info has fields
   betId
   isOverBettor
   wager
 */
function deletePending(info, user, callback) {
  async.waterfall(
  [
    function(callback) {
      var deletePendingCallback = function(err) {
        if (err && err.message === APPLIED) {
          callback(new Error('could not delete bet'));
        }
        else if (err) {
          callback(err);
        }
        else {
          callback(null);
        }
      };
      UpdateBet.deletePending(
        info.betId,
        info.isOverBettor,
        user.username,
        info.wager,
        callback);
    },
    function(callback) {
      User.addMoney(user.money, info.wager, user.user_id, callback);
    }
  ],
  callback);
}

/*
 info has fields
        info.athleteId,
        info.athleteName,
        info.athleteTeam,
        info.betId,
        info.fantasyValue,
        info.opponent,        
        info.overNotUnder,
        info.wager,
 */
/**
 * @param  {object}   info
 * @param  {Function} callback
 * args: (err)
 */
function takePending(info, user, callback) {
  var fantasyValue = parseFloat(info.fantasyValue);
  var payoff = parseFloat(info.payoff);
  var price = parseFloat(info.price);
  var overNotUnder = (info.overNotUnder === 'true');

  async.waterfall(
  [
    function(callback) {
      User.subtractMoney(user.money, price, user.user_id, callback);
    },
    function(callback) {
      var takePendingCallback = function(err) {
        if (err && err.message === APPLIED) {
          User.addMoney(
            user.money - price,
            price,
            user.user_id,
            function(err) {
              if (err) {
                callback(err);
              }
              else {
                callback(new Error('bet has already been taken'));
              }
            });
        }
        else if (err) {
          callback(err);
        }
        else {
          callback(null);
        }
      };
      UpdateBet.takePending(
        info.athleteId,
        info.athleteName,
        info.athleteTeam,
        info.betId,
        fantasyValue,
        info.gameId,
        info.opponent,        
        overNotUnder,
        user.username,
        price,
        takePendingCallback);
    },
    function(callback) {
      async.parallel(
      [
        //for user
        function(callback) {
          BetHistory.insertHistory(
            info.athleteId,
            info.athleteName,
            info.athleteTeam,
            info.betId,
            fantasyValue,
            info.opponent,
            overNotUnder,
            payoff,
            price,
            false,
            user.username,
            callback);
        },
        //for opponent
        function(callback) {
          BetHistory.insertHistory(
            info.athleteId,
            info.athleteName,
            info.athleteTeam,
            info.betId,
            fantasyValue,
            user.username,
            !overNotUnder,
            payoff,
            price,
            true,
            info.opponent,
            callback);
        },
        //for timeseries
        function(callback) {
          Timeseries.insert(
            info.athleteId,
            fantasyValue,
            price,
            callback);
        }
      ], callback);
    }
  ], function(err) {
    callback(err);
  });
}

/*
 info has fields
  betId,
  expirationTimeMinutes,
  isOVerBetter,
  resellPrice
 */
function placeResell(info, user, callback) {
  UpdateBet.placeResell(
    info.betId,
    info.expirationTimeMinutes,
    info.isOverBettor,
    info.resellPrice,
    user.username,
    function(err) {
      if (err && err.message === APPLIED) {
        callback(new Error('could not place bet into resell!'));
      }
      else if (err) {
        callback(err);
      }
      else {
        callback(null);
      }
    });
}

//info has fields
/*
        info.athleteId,
        info.athleteName,
        info.athleteTeam,
        info.betId,
        info.fantasyValue,
        info.opponent,
        info.overNotUnder,
        info.price,
 */
function takeResell(info, user, callback) {
  async.waterfall(
  [
    function(callback) {
      User.subtractMoney(user.money, info.price, user.user_id, callback);
    },
    function(callback) {
      var takeResellCallback = function(err) {
        if (err && err.message === APPLIED) {
          User.addMoney(
            user.money - info.price,
            info.price,
            user.user_id,
            function(err) {
              if (err) {
                callback(err);
              }
              else {
                callback(new Error('could not buy resell'));
              }
            });
        }
        else if (err) {
          callback(err);
        }
        else {
          callback(null);
        }
      };

      UpdateBet.takeResell(
        info.athleteId,
        info.athleteName,
        info.athleteTeam,
        info.betId,
        info.fantasyValue,
        info.opponent,
        info.overNotUnder,
        info.price,
        user.username,
        takeResellCallback);
    },
    function(callback) {
      User.addMoneyToUserUsingUsername(info.price, info.opponent, callback);
    }
  ], callback);
}

exports.insertPending = insertPending;
exports.takePending = takePending;
exports.deletePending = deletePending;
exports.placeResell = placeResell;
exports.takeResell = takeResell;