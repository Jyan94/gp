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
var UpdateBet = require('./update');
var Timeseries = require('./timeseries');
var BetHistory = require('./betHistory');
 
var constants = configs.constants;
var APPLIED = constants.cassandra.APPLIED;

//need to verify gameId and athlete in game!!!
function verifyGameIdAndAthlete(
  athleteId,
  athleteName,
  athleteTeam,
  gameId,
  sport,
  callback) {

  callback(null);
}

/**
  info fields:

  athleteId, 
  athleteName,
  athleteTeam,
  expirationTimeMinutes,
  fantasyValue,
  gameId,
  isOverBetter,
  sport,
  wager
 * [insertPending description]
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
        info.athleteName,
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
        info.athleteName,
        info.athleteTeam,
        cql.types.timeuuid(),
        info.expirationTimeMinutes,
        info.fantasyValue,
        info.gameId,
        info.isOverBetter,
        info.sport,
        user.username,
        info.wager,
        callback);
    }
  ], callback);
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

function waterfallTakePending(info, user, callback) {
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
}

function takePending(info, user, callback) {

  async.waterfall(
  [
    function(callback) {
      User.subtractMoney(user.money, info.wager, user.user_id, callback);
    },
    function(callback) {
      waterfallTakePending(info, user, callback);
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
      ], function(err) {
        callback(err);
      });
    }
  ], callback);
}

//info contains
//
function placeResell(info, user, callback) {
  var placeResellCallback = function(err) {
    if (err && err.message === APPLIED) {
      callback(new Error('could not place bet for resell'));
    }
    else if (err) {
      callback(err);
    }
    else {
      callback(null);
    }
  };
  UpdateBet.placeResell(
    info.betId,
    info.expirationTimeMinutes,
    info.isOverBetter,
    info.resellPrice,
    user.username,
    placeResellCallback);
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

  async.waterfall(
  [
    function(callback) {
      User.subtractMoney(user.money, info.price, user.user_id, callback);
    },
    function(callback) {
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

//info has fields betId, isOverBetter, price, username
function recallResell(info, user, callback) {
  var recallResellCallback = function(err) {
    if (err && err.message === APPLIED) {
      callback(new Error('could not recall resell'));
    }
    else if (err) {
      callback(err);
    }
    else {
      callback(null);
    }
  };
  UpdateBet.recallResell(
    info.betId,
    info.isOverBetter,
    info.price,
    user.username,
    recallResellCallback);
}

//info has fields betId, isOverBetter, wager
function cancelPending(info, user, callback) {
  var cancelPendingCallback = function(err) {
    if (err && err.message === APPLIED) {
      callback(new Error('could not cancel pending'));
    }
    else if (err) {
      callback(err);
    }
    else {
      callback(null);
    }
  };

  async.waterfall(
  [
    function(callback) {
      UpdateBet.deletePending(
        info.betId,
        info.isOverBetter,
        user.username,
        info.wager,
        cancelPendingCallback);
    },
    function(callback) {
      User.addMoney(user.money, info.wager, user.user_id, callback);
    }
  ], callback);
}

exports.insertPending = insertPending;
exports.takePending = takePending;
exports.placeResell = placeResell;
exports.takeResell = takeResell;
exports.recallResell = recallResell;
exports.cancelPending = cancelPending;