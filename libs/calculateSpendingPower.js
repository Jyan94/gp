'use strict';
require('rootpath')();
var configs = require('config/index');

var cql = configs.cassandra.cql;
var client = configs.cassandra.client;

var async = require('async');
var Bet = require('libs/cassandra/bet.js');
var User = require('libs/cassandra/user.js');
var Calculate = require('libs/applicationServer/calculateSpendingPowerHelper')

/* select all the current bets from the user */
function selectFromCurrentBets (userId, money, callback) {
  Bet.selectUsingUserId('current_bets', userId, function(err, result) {
    if (err) {
      callback(err);
    }
    else {
      callback(null, result, userId, money);
    }
  })
}

/* select all the pending bets from the user and add that to the user's
current bets (previous function) */
function selectFromPendingBets(result, userId, money, callback) {
  Bet.selectUsingUserId('pending_bets', userId, function(err, result1) {
    if (err) {
      callback(err);
    }
    else {
      for (var i = 0; i < result1.length; i++) {
        result.push(result1[i]);
      }
      callback(null, result, userId, money);
    }
  })
}

/* calculate the user's spending power */
exports.calculateSpendingPower = function(userId, money, callback) {
  async.waterfall ([
    function(callback) {
      callback(null, userId, money);
    },

    selectFromCurrentBets,

    selectFromPendingBets,

    Calculate.calculate
  ], function(err, spendingPower) {
    if (err) {
      callback(err);
    }
    callback(null, spendingPower)
  })
}

/* update the user's spending power */
exports.updateSpendingPower = function(userId, money) {
  exports.calculateSpendingPower(userId, money, function(err, result) {
    var spendingPower = result;
    User.updateSpendingPower(spendingPower, userId, function(err) {
      if (err) {
        console.log(err);
      }
      else {
        console.log("spending power: " + spendingPower);
      }
    })
  })
}

/* calculate the spending power if the user made or took another bet */
exports.calculateSpendingPowerWithAddition = function(userId,
  money,
  playerId,
  positionBool,
  multiplier,
  betValue,
  callback) {
  async.waterfall ([
    function(callback) {
      callback(null, userId, money);
    },

    selectFromCurrentBets,

    selectFromPendingBets,

    //push the new addition
    function(result, userId, money, callback) {

      result.push({
        'user_id': userId,
        'player_id': playerId,
        'long_position': positionBool,
        'bet_value' : betValue,
        'multiplier' : multiplier,
      })
      callback(null, result, userId, money);
    },

    Calculate.calculate
  ], function(err, spendingPower) {
    if (err) {
      callback(err);
    }
    else {
      callback(null, spendingPower);
    }
  })
}