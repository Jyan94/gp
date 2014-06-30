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
var multiline = require('multiline');

var APPLIED = configs.constants.dailyProphet.APPLIED;
var MAX_WAIT = configs.constants.dailyProphet.MAX_WAIT;

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
  var wagers = [];
  for (var i = 0; i < numAthletes; ++i) {
    predictions[i] = 0;
    wagers[i] = 0;
  }
  return {
    virtualMoneyRemaining : startingVirtualMoney,
    predictions: predictions,
    wagers: wagers,
    lastModified: null,
    joinTime: (new Date()).getTime()
  };
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
  var contestant = null;
  if (contest.contestants && contest.contestants.hasOwnProperty(user.username)){
    contestant = JSON.parse(contest.contestants[user.username]);
  }

  if (user.money < contest.entry_fee) {
    callback(new Error('not enough money'));
  }
  else if (contest.current_entries === contest.maximum_entries) {
    callback(new Error('contest is full'));
  }
  //deadline time should be in the future
  //if it's in the past, shouldn't be able to enter
  else if (contest.contest_deadline_time.getTime() < (new Date()).getTime()) {
    callback(new Error('cannot enter contest past deadline time'));
  }
  else if (contestant && contestant.instances.length === 
          contest.entries_allowed_per_contestant) {
    callback(new Error('exceeded maximum entries for user'));
  }
  else {
    var parallelArray =
    [
      //subtract money from user's current money
      function(callback) {
        User.updateMoneyOneUser(
          user.money - contest.entry_fee,
          user.user_id, 
          callback);
      }
    ];

    var waterfallArray =
    [
      function(callback) {
        Contestant.addContestant(
          user.username, 
          contestant, 
          contest.current_entries, 
          contest.contest_id,
          callback);
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
      contestant = {
        instances: [newContestantInstance]
      };
    }
    contestant = JSON.stringify(contestant);
    
    if (parallelArray.length > 1) {
      waterfallArray.push(function(callback) {
        async.parallel(parallelArray, callback);
      });
    }
    else {
      waterfallArray.push(parallelArray[0]);
    }

    async.waterfall(waterfallArray, callback);
  }
}

/**
 * read the contest
 * adds user to the contest and subtracts money from user
 * if the update fails, delay and attempt later
 * @param {Object}   user
 * req.user passport object, contains username and money fields
 * @param {timeuuid}   contestId
 * uuid for contest
 * @param {Function} callback
 * args (err)
 */
function addContestant(user, contestId, callback) {
  var waterfallCallback = function (err) {
    if (err && err.message === APPLIED) {
      setTimeout(function() {
        addContestant(user, contestId, callback);
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
exports.addUserInstanceToContest = addUserInstanceToContest;
/**
 * ====================================================================
 * Used exports
 * ====================================================================
 */
exports.addContestant = addContestant;