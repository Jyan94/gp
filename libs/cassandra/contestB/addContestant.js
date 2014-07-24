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
 * args: (err, result)
 * where result is the newly added instance's index
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
  else if (!configs.isDev() &&
           contest.contest_deadline_time.getTime() < (new Date()).getTime()) {
    callback(new Error('cannot enter contest past deadline time'));
  }
  else if (contestant && contestant.instances.length === 
          contest.entries_allowed_per_contestant) {
    callback(new Error('exceeded maximum entries for user'));
  }
  else {
    var addContestant = function(callback) {
      var addContestantCallback = function(err) {
        if (err) {
          //restore user to money before add if add contestant fails
          User.addMoney(
            user.money - contest.entry_fee,
            contest.entry_fee,
            user.user_id,
            function(addMoneyErr) {
              if (addMoneyErr) {
                callback(addMoneyErr);
              }
              else {
                callback(err);
              }
            });
        }
        else {
          callback(null);
        }
      };
      
      Contestant.addContestant(
        user.username, 
        contestant, 
        contest.current_entries, 
        contest.contest_id,
        addContestantCallback);
    };

    var waterfallArray =
    [
      function(callback) {
        User.subtractMoney(
          user.money,
          contest.entry_fee,
          user.user_id,
          callback);
      },
      function(callback) {
        addContestant(callback);
      }
    ];

    contest.current_entries = contest.current_entries + 1;
    if (contest.current_entries === contest.maximum_entries) {
      waterfallArray.push(function(callback) {
        UpdateContest.setFilled(contest.contest_id, callback);
      });
    }

    var newContestantInstance = createNewContestantInstance(
          contest.starting_virtual_money,
          contest.athletes.length);
    if (contestant) {
      contestant.instances.push(newContestantInstance);
    }
    else {
      contestant = {
        instances: [newContestantInstance]
      };
    }
    var newlyAddedIndex = contestant.instances.length - 1;
    contestant = JSON.stringify(contestant);
    //if contest.contestants is null, initialize it
    //make sure it's updated for addAndUpdateContestant
    if (!contest.contestants) {
      contest.contestants = {};
    }
    contest.contestants[user.username] = contestant;

    var waterfallCallback = function(err, result) {
      if (err && err.message === APPLIED) {
        setTimeout(function() {
          addUserInstanceToContest(user, contest, callback);
        }, Math.random() * MAX_WAIT);
      }
      else if (err) {
        callback(err);
      }
      else {
        callback(null, newlyAddedIndex);
      }
    };
    async.waterfall(waterfallArray, waterfallCallback);
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
 * args (err, result)
 * result will be the instance index of the newly added contestant instance
 */
function addContestant(user, contestId, callback) {
  async.waterfall(
  [
    function(callback) {
      SelectContest.selectById(contestId, callback);
    },
    function(contest, callback) {
      addUserInstanceToContest(user, contest, callback);
    }
  ],
  callback);
}

/**
 * ====================================================================
 * Test exports
 * ====================================================================
 */
exports.addContestant = addContestant;
exports.createNewContestantInstance = createNewContestantInstance;

/**
 * ====================================================================
 * Used exports
 * ====================================================================
 */
exports.addUserInstanceToContest = addUserInstanceToContest;