/**
 * ====================================================================
 * Author: Harrison Zhao
 * ====================================================================
 */
'use strict';
(require('rootpath')());

var Lock = require('./lock');
var SelectContest = require('./select');
var UpdateContest = require('./update');

var User = require('libs/cassandra/user');

var async = require('async');
var multiline = require('multiline');

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
  var contestant = JSON.parse(contest.contestants[user.username]);
  if (!contestant) {
    callback(new Error('contestant does not exist, should not ever happen!'));
  } 
  else if (!(contestant.instances.length>instanceIndex && instanceIndex>=0)) {
    callback(new Error('out of bounds instance index'));
  }
  else {
    var parallelArray = 
    [
      function(callback) {
        User.updateMoney(
          [user.money + contest.entry_fee], 
          [user.user_id], 
          callback);
      }
    ];

    //removes instanceIndex element and removes contestant from map if
    //instance's length is 0
    contestant.instances.splice(instanceIndex, 1);
    if (contestant.instances.length === 0) {
      parallelArray.push(function(callback) {
        UpdateContest.deleteContestant(
          user.username, 
          contest.contest_id, 
          callback);
      });
    }
    else {
      parallelArray.push(function(callback) {
        UpdateContest.setContestant(
          user.username, 
          contestant, 
          contest.current_entries - 1, 
          contest.contest_id,
          callback);  
      });
    }

    contestant = JSON.stringify(contestant);

    //update contest state
    var beforeDeadline = (+(new Date()) < +contest.contest_deadline_time);
    if (contest.current_entries === contest.maximum_entries && beforeDeadline) {
      parallelArray.push(function(callback) {
        UpdateContest.setOpen(contest.contest_id, callback);
      });
    }
    else if (contest.current_entries < contest.minimum_entries && 
             !beforeDeadline) {
      parallelArray.push(function(callback) {
        UpdateContest.setCancelled(contest.contest_id, callback);
      });
    }

    //update in database
    async.parallel(parallelArray, callback);

  }
}

/**
 * removes contestant instance
 * obtains lock, selects the contest, removes the instance, release lock
 * @param  {object}   user
 * from req.user, MUST have fields user_id and username
 * @param  {int}   instanceIndex 
 * index to be removed from instances
 * @param  {uuid}   contestId
 * id of contest
 * @param  {Function} callback      
 * args: (err)
 */
function removeContestantInstance(user, instanceIndex, contestId, callback) {

  var waterfallCallback = function (waterfallErr) {
    Lock.releaseLock(contestId, function(err) {
      if (waterfallErr) {
        callback(waterfallErr);
      }
      if (err) {
        callback(err);
      }
      else {
        callback(null);
      }
    });
  };

  async.waterfall([
    function(callback) {
      Lock.tryObtainLock(user, contestId, callback);
    },
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
 * Test exports
 * ====================================================================
 */
exports.removeInstanceFromContest = removeInstanceFromContest;

/**
 * ====================================================================
 * Used exports
 * ====================================================================
 */
exports.removeContestantInstance = removeContestantInstance;