/**
 * ====================================================================
 * Author: Harrison Zhao
 * ====================================================================
 */
'use strict';
(require('rootpath')());

var SelectContest = require('./select');
var UpdateContestant = require('./contestant');
var TimeSeries = require('./timeseries');

var async = require('async');
var multiline = require('multiline');

var minuteInMilliseconds = 60000;
/**
 * verifies if the instance
 * @param  {object}   user 
 * user object from req.user
 * @param  {object}   instance 
 * updated instance to be inserted into the database
 * @param  {object}   contest
 * contest object obtained from the database
 * @param  {Function} callback
 * args: (err, contest)
 */
function verifyInstance(user, instance, contest, callback) {
  if (!(contest.contestants.hasOwnProperty(user.username))) {
    callback(new Error('username does not exist in contest'));
  }
  else if (!(instance && instance.predictions && instance.wagers)) {
    callback(new Error('instance format'));
  }
  else if (instance.predictions.length !== instance.wagers.length) {
    callback(new Error('wagers length do not match with predictions length'));
  }
  else if (Object.keys(contest.athletes).length 
          !== instance.predictions.length) {
    callback(new Error('invalid number of athletes'));
  }
  else {
    var reduceFunc = function(memo, item, callback) {
      if (item < 0) {
        callback(new Error('negative wager'));
      }
      else if (item > contest.max_wager) {
        callback(new Error('wager above max'));
      }
      else {
        callback(null, memo + item); 
      }
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
    async.reduce(instance.wagers, 0, reduceFunc, reduceCallback);
  }
}

/**
 * compares two instances and inserts all updated bets into the database
 * @param  {object}   oldInstance 
 * previous contestant instance
 * @param  {object}   newInstance 
 * new contestant instance
 * @param  {object}   contest    
 * contest object from the database
 * @param  {Function} callback
 * args: (err)
 */
function compareInstances(user, oldInstance, newInstance, contest, callback) {
  //convert all serialized json text fields of athlete map to object
  var timeseriesUpdates = [];
  for (var i = 0; contest.athletes.hasOwnProperty(i); ++i) {
    if (oldInstance.predictions[i] !== newInstance.predictions[i] ||
        oldInstance.wagers[i] !== newInstance.wagers[i]) {
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
        user.username, 
        callback);
    };
    async.each(timeseriesUpdates, updateTimeseriesTable, callback);
  }
}

/**
 * replaces the old contestant instance with the new contestant instance
 * @param  {object}   user           
 * user object from req.user
 * @param  {int}   instanceIndex
 * index of the instance to modify
 * @param  {object}   updatedInstance
 * updated instance object for contestant instance
 * @param  {object}   contest
 * contest object from the database
 * @param  {Function} callback
 * args: (err)
 */
function updateInstance(
  user, 
  instanceIndex, 
  updatedInstance, 
  contest, 
  callback) {

  var contestant = JSON.parse(contest.contestants[user.username]);
  var cooldownInMilliseconds = minuteInMilliseconds * contest.cooldown_minutes;
  if (contestant.instances[instanceIndex].lastModified &&
      contestant.instances[instanceIndex].lastModified+cooldownInMilliseconds >
      (new Date()).getTime()) {
    callback(new Error('cooldown has not expired'));
  }
  else if (instanceIndex < contestant.instances.length) {
    var compareCallback = function(err) {
      if (err) {
        callback(err);
      }
      else {
        updatedInstance.lastModified = (new Date()).getTime();
        contestant.instances[instanceIndex] = updatedInstance;
        UpdateContestant.updateContestant(
          user.username, 
          JSON.stringify(contestant), 
          contest.contest_id, 
          callback);
      }
    };

    var oldInstance = contestant.instances[instanceIndex];
    compareInstances(
      user, 
      oldInstance, 
      updatedInstance, 
      contest, 
      compareCallback);
  }
  else {
    callback(new Error('out of bounds index'));
  }
}

/**
 * selects the contest
 * verifies that the updated instance is a valid instance
 * then updates the instance
 * @param  {object}   user            
 * user from req.user
 * @param  {int}   instanceIndex   
 * index of contestant instance 
 * @param  {object}   updatedInstance
 * updated instance for contestant as an object
 * @param  {uuid}   contestId       
 * @param  {Function} callback
 * args: (err)
 */
function updateContestantInstance(
  user, 
  instanceIndex, 
  updatedInstance, 
  contestId, 
  callback) {

  async.waterfall(
  [
    function(callback) {
      SelectContest.selectById(contestId, callback);
    },
    function(contest, callback) {
      verifyInstance(user, updatedInstance, contest, callback);
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