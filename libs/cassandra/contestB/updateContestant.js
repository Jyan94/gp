/**
 * ====================================================================
 * Author: Harrison Zhao
 * ====================================================================
 */
'use strict';
(require('rootpath')());

var SelectContest = require('./select');
var UpdateContest = require('./update');

var CONTEST_TYPE = require('configs/constants').contestBType;
var TimeSeries = require('libs/cassandra/timeseriesFantasyValues');

var async = require('async');
var multiline = require('multiline');

function verifyInstance(instance, contest, callback) {
  if (Object.keys(contest.athletes).length !== instance.predictions.length) {
    callback(new Error('invalid number of athletes'));
  }
  else {
    var reduceFunc = function(memo, item, callback) {
      callback(null, memo + item); 
    };
    var reduceCallback = function (err, result) {
      if (err) {
        callback(err);
      }
      else if ((instance.virtualMoneyRemaining + result) !== 
                contest.starting_virtual_money){
        callback(new Error('numbers do not add up'));
      }
      else {
        callback(null, contest);
      }
    };
    async.reduce(instance.predictions, 0, reduceFunc, reduceCallback);
  }
}

var UPDATE_CONTESTANT_QUERY = multiline(function() {/*
  UPDATE
    contest_B
  SET
    contestants['?'] = ?
  WHERE
    contest_id = ?;
*/});

function compareInstances(oldInstance, newInstance, contest, callback) {
  //convert all serialized json text fields of athlete map to object
  var timeseriesUpdates = [];
  for (var i = 0; contest.athletes.hasOwnProperty(i); ++i) {
    if (oldInstance.predictions[i] !== newInstance.predictions[i]) {
      timeseriesUpdates.push({
        athleteId: JSON.parse(contest.athletes[i]).athleteId,
        wager: newInstance.wagers[i],
        fantasyValue: newInstance.predictions[i]
      });
    }
  }
  if (timeseriesUpdates.length > 0) {
    var updateTimeseriesTable = function(update, callback) {
      TimeSeries.insert(
        update.athleteId, 
        update.fantasyValue, 
        update.wager, 
        CONTEST_TYPE, 
        callback);
    };
    async.each(timeseriesUpdates, updateTimeseriesTable, callback);
  }
}

function updateInstance(
  user, instanceIndex, updatedInstance, contest, callback) {
  var contestant = JSON.parse(contest.contestestants[user.username]);
  var oldInstance = contestant.instance[instanceIndex];
  compareInstances(oldInstance, updatedInstance, contest, function(err) {
    if (err) {
      callback(err);
    }
    else {
      contestant.instances[instanceIndex] = updatedInstance;
      UpdateContest.updateContestant(
        user.username, 
        JSON.stringify(contestant), 
        contest.contest_id, 
        callback);
    }
  });
}

function updateContestantInstance(
  user, instanceIndex, updatedInstance, contestId, callback) {
  async.waterfall([
    function(callback) {
      SelectContest.selectById(contestId, callback);
    },
    function(contest, callback) {
      verifyInstance(updatedInstance, contest, callback);
    },
    function(contest, callback) {
      updateInstance(user, instanceIndex, updatedInstance, contest, callback);
    }
  ],
  callback);
}

/**
 * ====================================================================
 * Test exports
 * ====================================================================
 */
exports.verifyInstance = verifyInstance;
exports.compareInstances = compareInstances;
exports.updateInstance = updateInstance;
/**
 * ====================================================================
 * Used exports
 * ====================================================================
 */
exports.updateContestantInstance = updateContestantInstance;