/**
 * ====================================================================
 * Author: Harrison Zhao
 * ====================================================================
 */
'use strict';
(require('rootpath')());

var SelectContest = require('./select');
var Contestant = require('./contestant');
var TimeSeries = require('./timeseries');
var configs = require('config/index');

var async = require('async');

var minuteInMilliseconds = configs.constants.globals.MINUTE_IN_MILLISECONDS;
var millisecondsToStr = configs.constants.globals.millisecondsToStr;

var COOLDOWN_MSG = configs.constants.contestB.COOLDOWN_MSG;

/**
 * verifies if the instance
 * @param  {object}   user 
 * user object from req.user
 * @param  {int}   instanceIndex
 * index of the instance to modify
 * @param  {object}   instance 
 * updated instance to be inserted into the database
 * @param  {object}   contest
 * contest object obtained from the database
 * @param  {Function} callback
 * args: (err, contest)
 */
function verifyInstance(user, instanceIndex, instance, contest, callback) {
  if (!(contest.contestants.hasOwnProperty(user.username))) {
    callback(new Error('username does not exist in contest'));
  }
  else if (!(instance && 
             instance.predictions && 
             instance.wagers && 
             !isNaN(instance.virtualMoneyRemaining) &&
             Array.isArray(instance.predictions) && 
             Array.isArray(instance.wagers))) {
    callback(new Error('instance format error'));
  }
  else if (instance.virtualMoneyRemaining !== 0) {
    callback(new Error('must spend all money'));
  }
  else if (instance.predictions.length !== instance.wagers.length) {
    callback(new Error('wagers length do not match with predictions length'));
  }
  else if (contest.athletes.length !== instance.predictions.length) {
    callback(new Error('invalid number of athletes'));
  }
  else {
    var checkIfValidPredictions = function(callback) {
      async.each(instance.predictions, function(value, callback) {
        if (isNaN(value) || value < 0) {
          callback(new Error('undefined prediction'));
        }
        else {
          callback(null);
        }
      },
      callback);
    };

    var reduceFunc = function(memo, item, callback) {
      if (isNaN(item) || item < 0) {
        callback(new Error('undefined value'));
      }
      else if (item < 0) {
        callback(new Error('negative wager'));
      }
      else if (item > contest.max_wager) {
        callback(new Error('wager above max'));
      }
      else {
        callback(null, memo + item); 
      }
    };
    
    var checkIfValidWagers = function (callback) {
      async.reduce(instance.wagers, 0, reduceFunc, function (err, result) {
        if (err) {
          callback(err);
        }
        else if ((instance.virtualMoneyRemaining + result) !== 
                  contest.starting_virtual_money){
          callback(new Error('numbers do not add up'));
        }
        else {
          callback(null);
        }
      });
    };

    async.parallel(
    [
      checkIfValidPredictions,
      checkIfValidWagers
    ],
    function(err) {
      callback(err, contest);
    });
  }
}

/**
 * compares two instances and inserts all updated bets into timeseries
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
  for (var i = 0; i !== contest.athletes.length; ++i) {
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
  else {
    callback(null);
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
  var now = (new Date()).getTime();
  
  if (instanceIndex >= contestant.instances.length || instanceIndex < 0) {
    callback(new Error('out of bounds index'));
  }
  //give minute leeway to new joiners (joinTime + leeway must be > than now)
  //else check if for hard deadline
  else if (contestant.instances[instanceIndex].joinTime + minuteInMilliseconds 
           < now || contest.contest_deadline_time.getTime() < now){
    callback(new Error('cannot update instance after deadline'));
  }
  //last modified + cooldown should be in the past
  //if it's in the future, should not be able to modify
  else if (contestant.instances[instanceIndex].lastModified &&
           contestant.instances[instanceIndex].lastModified + 
           cooldownInMilliseconds > now) {
    var lastModifiedPlusCooldown = 
      contestant.instances[instanceIndex].lastModified + 
      cooldownInMilliseconds;
    var difference = lastModifiedPlusCooldown - now;
    callback(new Error(
      'cooldown has not expired yet ' + 
      millisecondsToStr(difference) + 
      ' remaining'));
  }
  else {
    var compareCallback = function(err) {
      if (err) {
        callback(err);
      }
      else {
        updatedInstance.lastModified = (new Date()).getTime();
        contestant.instances[instanceIndex] = updatedInstance;
        Contestant.updateContestant(
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
 * @param  {timeuuid}   contestId       
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
      verifyInstance(user, instanceIndex, updatedInstance, contest, callback);
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
exports.compareInstances = compareInstances;
/**
 * ====================================================================
 * Used exports
 * ====================================================================
 */
exports.updateContestantInstance = updateContestantInstance;
exports.updateInstance = updateInstance;
exports.verifyInstance = verifyInstance;