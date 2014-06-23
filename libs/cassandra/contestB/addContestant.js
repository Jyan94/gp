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
 * creates a new contestant instance object
 * @param  {int} startingVirtualMoney
 * amount of virtual money the user starts
 * @param  {int} numAthletes 
 * number of athletes a user can wager on for the given contest
 * @return {object}
 * object virtual money remaining and an zero filled array for predictions
 */
function createNewContestantInstance(startingVirtualMoney, numAthletes) {
  var predictions = [];
  for (var i = 0; i < numAthletes; ++i) {
    predictions[i] = 0;
  }
  return {
    virtualMoneyRemaining : startingVirtualMoney,
    predictions: predictions
  };
}

/**
 * subtracts entry fee from user's current money, 
 * error if user doesn't have enough
 * @param  {object}   user
 * user object from req.user
 * MUST have user.money
 * @param  {object}   contest
 * contest object from database
 * @param  {Function} callback
 * args: (err)
 */
function subtractMoneyFromUser(user, contest, callback) {
  if (user.money < contest.entry_fee) {
    callback(new Error('should never get here! bug!'));
  }
  else {
    var leftoverMoney = user.money - contest.entry_fee;
    User.updateMoney([leftoverMoney], [user.user_id], callback);
  }
}

/**
 * checks if user has enough money, if contest full, and if user can still enter
 * if passes all checks, updates a user's instances for a given contest
 * if the user is not part of the contest already, inserts the user in
 * else appends a new instance to a list of instances
 * @param {object}   user
 * user object from req.user
 * @param {object}   contest  
 * contest object from database
 * @param {Function} callback
 * args: (err)
 */
function addUserInstanceToContest(user, contest, callback) {
  var contestant = JSON.parse(contest.contestants[user.username]);
  if (user.money < contest.entry_fee) {
    callback(new Error('not enough money'));
  }
  else if (contest.current_entries === contest.maximum_entries) {
    callback(new Error('contest is full'));
  }
  else if (contestant && contestant.instances.length === 
          contest.entries_allowed_per_contestant) {
    callback(new Error('exceeded maximum entries for user'));
  }
  else {
    var parallelArray =
    [
      function(callback) {
        UpdateContest.setContestant(
          user.username, 
          contestant, 
          contest.current_entries, 
          contest.contest_id,
          callback);
      },
      function(callback) {
        subtractMoneyFromUser(user, contest, callback);
      }
    ];

    contest.current_entries = contest.current_entries + 1;
    if (contest.current_entries === contest.maximum_entries) {
      parallelArray.push(function(callback) {
        UpdateContest.setFilled(contest.contest_id, callback);
      });
    }

    var newContestantInstance = createNewContestantInstance(
          contest.starting_virtual_money,
          Object.keys(contest.athletes).length);
    if (contestant) {
      contestant.instances.push(newContestantInstance);
    }
    else {
      contestant = {instances: [newContestantInstance]};
    }
    contestant = JSON.stringify(contestant);

    async.parallel(parallelArray, callback);

  }
}

/**
 * obtains a lock on adding / removing users for a given contest
 * read the contest
 * adds user to the contest and subtracts money from user
 * releases lock
 * @param {Object}   user
 * req.user passport object, contains username and money fields
 * @param {uuid}   contestId
 * uuid for contest
 * @param {Function} callback
 * args (err)
 */
function addContestant(user, contestId, callback) {
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
      addUserInstanceToContest(user, contest, callback);
    }
  ],
  waterfallCallback);
}

/**
 * ====================================================================
 * Test exports
 * ====================================================================
 */
exports.createNewContestantInstance = createNewContestantInstance;
exports.subtractMoneyFromUser = subtractMoneyFromUser;
exports.addUserInstanceToContest = addUserInstanceToContest;
/**
 * ====================================================================
 * Used exports
 * ====================================================================
 */
exports.addContestant = addContestant;