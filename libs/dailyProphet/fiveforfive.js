/**
 * ====================================================================
 * Author: Harrison Zhao
 * ====================================================================
 */
'use strict';
(require('rootpath')());

var ContestB = require('libs/cassandra/contestB/exports');
var User = require('libs/cassandra/user');

var async = require('async');

var MINIMUM = 20;
var CUTOFF = 0.05;
var ONE = 1.00;
var ZERO = 0.0;
var FIVE = 5;

function selectFive(results, callback) {
  var indexes = {};
  var index;
  var upperBound = Math.round(results.length * (ONE - CUTOFF));
  var lowerBound = Math.round(results.length * (ZERO + CUTOFF));

  for (var i = 0; i !== 5; ++i) {
    index = Math.round(Math.random() * (results.length - 1));
    while ((!indexes[index]) || (index > upperBound) || (index < lowerBound)) {
      index = Math.round(Math.random() * (results.length - 1));
    }
    indexes[index] = 1;
  }
  indexes = Object.keys(indexes);
  for (var j = 0; j !== 5; ++j) {
    indexes[j] = results[indexes[j]];
  }
  callback(null, indexes);
}

function fiveForFive(user, playerId, callback) {
  if (user.money < FIVE) {
    callback(new Error('not enough money'));
  }
  else {

    var waterfallCallback = function(err, fiveValues) {
      if (err) {
        callback(err);
      }
      else {
        User.updateMoneyOneUser(
          user.money - FIVE, 
          user.user_id, 
          function(err) {
            if (err) {
              callback(err);
            }
            else {
              callback(null, fiveValues);
            }
          });
      }
    };

    async.waterfall([
      function(callback) {
        ContestB.timeseries.selectActivePlayerValues(playerId, callback);
      },
      function(fantasyValues, callback) {
        async.reject(fantasyValues, function(datapoint, callback) {
          callback(datapoint.username === user.username);
        }, function (results) {
          callback(null, results);
        });
      },
      function(filteredValues, callback) {
        if (filteredValues.length < MINIMUM) {
          callback(new Error('too few values for five for five'));
        }
        else {
          async.sortBy(filteredValues, function(datapoint, callback) {
            callback(null, filteredValues.fantasy_value)
          }, function(err, results) {
            callback(null, results);
          });
        }
      },
      function(sortedValues, callback) {
        selectFive(sortedValues, callback);
      }
    ], waterfallCallback);
  }
}

exports.fiveForFive = fiveForFive;