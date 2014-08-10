/**
 * ====================================================================
 * Author: Harrison Zhao
 * ====================================================================
 */
'use strict';
(require('rootpath')());

var DailyProphet = require('libs/cassandra/contestB/exports');
var User = require('libs/cassandra/user');

var async = require('async');

var MINIMUM = 20;
var CUTOFF = 0.05;
var ONE = 1.00;
var ZERO = 0.0;
var FIVE = 5;

/**
 * selects 5 random values from the cutoff percentage to the 1-cutoff percentage
 * @param  {array}   results
 * sorted by fantasy value array of rows
 * @param  {Function} callback
 * args: (err, results)
 * where results is an array of length 5
 */
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

/**
 * checks if user has enough money for five for five and
 * selects all predictions on a player that are not owned by a given user
 * checks if there enough values
 * if there are, sort and select five randomly
 * @param  {object}   user
 * from req.user, must have properties username and money
 * @param  {uuid}   athleteId
 * id for athlete
 * @param  {Function} callback
 * args: (err, results)
 * where results is an array of length 5 containing fantasy values
 */
function fiveForFive(user, athleteId, callback) {
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
        DailyProphet.timeseries.selectActivePlayerValues(athleteId, callback);
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