'use strict';
require('rootpath')();
var configs = require('config/index');

var cql = configs.cassandra.cql;
var client = configs.cassandra.client;

var async = require('async');
var Bet = require('libs/cassandra/bet.js');

function calculate(result, userId, money, callback) {
  var increase = 0.0;
  var playerCheckedArr = [];
  for (var i = 0; i < result.length; i++) {
    var player1 = result[i];
    var templong = 0.0;
    var tempshort = 0.0;
    for (var j = i+1; j < result.length; j++) {
      var player2 = result[j];
      if (playerCheckedArr.indexOf(i) === -1 && player1.player_id === player2.player_id) {
        if (player2.user_id === undefined) {
          if (player2.long_better_id === userId) {
            console.log()
            templong = templong + player2.bet_value * player2.multiplier;
          }
          else {
            tempshort = tempshort = player2.bet_value * player2.multiplier;
          }
        }
        else {
          if (player2.long_position === true) {
            templong = templong + player2.bet_value * player2.multiplier;
          }
          else {
            tempshort = tempshort = player2.bet_value * player2.multiplier;
          }
        }
        playerCheckedArr.push(j)
      }
    }
    if (playerCheckedArr.indexOf(i) === -1) {
      if (player1.user_id === undefined) {
        if (player1.long_better_id === userId) {
          templong = templong + player1.bet_value * player1.multiplier;
        }
        else {
          tempshort = tempshort + player1.bet_value * player1.multiplier;
        }
      }
      else {
        if (player1.long_position === true) {
          templong = templong + player1.bet_value * player1.multiplier;
        }
        else {
          tempshort = tempshort = player1.bet_value * player1.multiplier;
        }
      }
    }
    //console.log("templong: " + templong);
    //console.log("tempshort: " + tempshort);
    increase = increase + tempshort - templong;
  }
  var spendingPower = money + increase;
  //console.log(spendingPower);
  callback(null, spendingPower)
}

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

exports.calculateSpendingPower = function(userId, money, callback) {
  async.waterfall ([
    function(callback) {
      callback(null, userId, money);
    },

    selectFromCurrentBets,

    selectFromPendingBets,

    calculate
  ], function(err, spendingPower) {
    if (err) {
      callback(err);
    }
    callback(null, spendingPower)
  })
}

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

    calculate
  ], function(err, spendingPower) {
    if (err) {
      callback(err);
    }
    else {
      callback(null, spendingPower);
    }
  })
}
/*
calculateSpendingPower('2e90767c-375c-40b6-9527-69a6a9cc5bea', 10000)
calculateSpendingPowerWithAddition('2e90767c-375c-40b6-9527-69a6a9cc5bea',
 10000, '77726967-6864-6130-3300-000000000000', false, 100, 100, function(err,result) {
  if (err) {
    console.log(err);
  }
 })*/