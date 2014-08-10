/**
 * ====================================================================
 * Author: Harrison Zhao
 * ====================================================================
 */
'use strict';
(require('rootpath')());

var SelectContest = require('./select');
var UpdateContest = require('./update');
var Contestant = require('./contestant');

var configs = require('config/index');
var User = require('libs/cassandra/user');

var async = require('async');

var APPLIED = configs.constants.cassandra.APPLIED;
var MAX_WAIT = configs.constants.contestB.MAX_WAIT;
var TIME_BEFORE_CANCEL = 
  configs.constants.contestB.MAX_TIME_BEFORE_DEADLINE_TO_CANCEL;

/**
 * removes contestant instance from contestant object
 * updates the contest's current_entries
 * opens and possibly cancels the contest, depending on deadline time
 * @param  {object}   user
 * from req.user
 * @param  {object}   contest      
 * database contest object
 * @param  {int}   instanceIndex 
 * index of contest to be removed
 * @param  {Function} callback      
 * args: (err)
 */
function removeInstanceFromContest(user, contest, instanceIndex, callback) {
  var contestant = null;
  var removeDeadlineMilliseconds = null;
  if (configs.isDev()) {
    removeDeadlineMilliseconds = contest.contest_deadline_time.getTime();
  }
  else {
    removeDeadlineMilliseconds = 
      contest.contest_deadline_time.getTime() - TIME_BEFORE_CANCEL;
  }

  if (contest.contestants && contest.contestants.hasOwnProperty(user.username)){
    contestant = JSON.parse(contest.contestants[user.username]);
  }
  if (!contestant) {
    callback(new Error('contestant does not exist, should never happen!'));
  }
  //if past deadline time to cancel, don't allow cancelling
  else if (removeDeadlineMilliseconds < (new Date()).getTime()) {
    callback(new Error('cannot leave contest after cancel deadline'));
  }
  else if (!(contestant.instances.length>instanceIndex && instanceIndex>=0)) {
    callback(new Error('out of bounds instance index'));
  }
  else {
    var waterfallArray = 
    [
      function(callback) {
        Contestant.removeContestant(
          user.username, 
          contestant, 
          contest.current_entries - 1, 
          contest.contest_id,
          callback);  
      }
    ];

    var parallelArray = 
    [
      function(callback) {
        User.addMoney(
          user.money,
          contest.entry_fee, 
          user.user_id, 
          callback);
      }
    ];

    //removes instanceIndex element and removes contestant from map if
    //instance's length is 0
    contestant.instances.splice(instanceIndex, 1);
    if (contestant.instances.length === 0) {
      parallelArray.push(function(callback) {
        Contestant.deleteUsernameFromContest(
          user.username, 
          contest.contest_id, 
          callback);
      });
    }

    contestant = JSON.stringify(contestant);

    //update contest state if necessary
    if (contest.current_entries === contest.maximum_entries) {
      parallelArray.push(function(callback) {
        UpdateContest.setOpen(contest.contest_id, callback);
      });
    }

    //add to waterfall
    if (parallelArray.length > 1) {
      waterfallArray.push(function(callback) {
        async.parallel(parallelArray, callback);
      });
    }
    else {
      waterfallArray.push(parallelArray[0]);
    }

    //update in database
    async.waterfall(waterfallArray, callback);
  }
}

/**
 * removes contestant instance
 * selects the contest, removes the instance
 * if the update failed, delay and attempt later
 * @param  {object}   user
 * from req.user, MUST have fields user_id and username
 * @param  {int}   instanceIndex 
 * index to be removed from instances
 * @param  {timeuuid}   contestId
 * id of contest
 * @param  {Function} callback      
 * args: (err)
 */
function removeContestantInstance(user, instanceIndex, contestId, callback) {

  var waterfallCallback = function (err) {
    if (err && err.message === APPLIED) {
      setTimeout(function() {
        removeContestantInstance(user, instanceIndex, contestId, callback);
      }, Math.random() * MAX_WAIT);
    }
    else if (err) {
      callback(err);
    }
    else {
      callback(null);
    }
  };

  async.waterfall([
    function(callback) {
      SelectContest.selectById(contestId, callback);
    },
    function(contest, callback) {
      removeInstanceFromContest(user, contest, instanceIndex, callback);
    }
  ],
  waterfallCallback);
}

/**
 * ====================================================================
 * Used exports
 * ====================================================================
 */
exports.removeContestantInstance = removeContestantInstance;
exports.removeInstanceFromContest = removeInstanceFromContest;