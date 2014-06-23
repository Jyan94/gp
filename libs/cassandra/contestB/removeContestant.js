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

function removeInstanceFromContest(user, contest, instanceIndex, callback) {
  var contestant = JSON.parse(contest.contestants[user.username]);
  if (!(contestant.instances.length > instanceIndex && instanceIndex >= 0)) {
    callback(new Error('out of bounds instance index'));
  }
  else {
    var parallelArray = 
    [
      function(callback) {
        UpdateContest.setContestant(
          user.username, 
          contestant, 
          contest.current_entries - 1, 
          contest.contest_id,
          callback);  
      },
      function(callback) {
        User.updateMoney(
          [user.money + contest.entry_fee], 
          [user.user_id], 
          callback);
      }
    ]
    contestant.instances.splice(instanceIndex, 1);
    contestant = JSON.stringify(contestant);

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

    async.parallel(parallelArray, callback);

  }
}

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