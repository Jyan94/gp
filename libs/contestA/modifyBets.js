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
 
var constants = configs.constants;
var APPLIED = constants.cassandra.APPLIED;

//need to verify gameId and athlete in game!!!
function verifyGameIdAndAthlete(
  athleteId,
  athleteImage,
  athleteName,
  athletePosition,
  athleteTeam,
  gameId,
  sport,
  callback) {
  if (configs.isDev()) {
    callback(null);
  }
  else {
    var verify = function(idMap, list) {
      var athleteObj = list[idMap[athleteId]];
      return 
        (athleteObj.image === athleteImage &&
         athleteObj.fullName === athleteName &&
         athleteObj.position === athletePosition &&
         athleteObj.statistics[athleteObj.statistics.length - 1].gameId === 
          gameId &&
         athleteObj.sport === sport); 
    }
    var athleteMap;
    var athleteList;
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
      User.subtractMoney(user.money, info.wager, user.user_id, callback);
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
        info.fantasyValue,
        info.gameId,
        info.isOverBettor,
        info.sport,
        user.username,
        info.wager,
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
  async.waterfall(
  [
    function(callback) {
      User.subtractMoney(user.money, info.wager, user.user_id, callback);
    },
    function(callback) {
      var takePendingCallback = function(err) {
        if (err && err.message === APPLIED) {
          User.addMoney(
            user.money - info.wager,
            info.wager,
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
        info.fantasyValue,
        info.opponent,        
        info.overNotUnder,
        user.username,
        info.wager,
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
            info.fantasyValue,
            info.opponent,
            info.overNotUnder,
            info.payoff,
            info.wager,
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
            info.fantasyValue,
            user.username,
            !info.overNotUnder,
            info.payoff,
            info.wager,
            true,
            info.opponent,
            callback);
        },
        //for timeseries
        function(callback) {
          Timeseries.insert(
            info.athleteId,
            info.fantasyValue,
            info.wager,
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