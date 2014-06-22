/**
 * ====================================================================
 * Author: Harrison Zhao
 * ====================================================================
 */
'use strict';
(require('rootpath')());

var cassandra = require('libs/cassandra/cql');
var cql = require('config/index.js').cassandra.cql;
var multiline = require('multiline');
var ContestEntries = require('libs/contestGeneral/countEntries');
var async = require('async');
var extend = require('node.extend');
var User = require('libs/cassandra/user');
var quorum = cql.types.consistencies.quorum;

function createNewContestantInstance(startingVirtualMoney, numAthletes) {
  var bets = [];
  for (var i = 0; i < numAthletes; ++i) {
    bets[i] = 0;
  }
  return {
    virtualMoneyRemaining : startingVirtualMoney,
    bets: bets
  };
}

function subtractMoneyFromUser(user, contest, callback) {
  if (user.money < contest.entry_fee) {
    callback(new Error('should never get here! bug!'));
  }
  else {
    var leftoverMoney = user.money - contest.entry_fee;
    User.updateMoney([leftoverMoney], [user.user_id], function(err, result) {
      if (err) {
        callback(new Error('update money bug!'));
      }
      else {
        callback(null);
      }
    });
  }
}

function addUserInstanceToContest(user, contest, callback) {
  if (user.money < contest.entry_fee) {
    callback(new Error('not enough money'));
  }
  else if (contest.current_entries === contest.maximum_entries) {
    callback(new Error('contest is full'));
  }
  else {
    contest.current_entries = contest.current_entries + 1;
    var newContestantInstance = createNewContestantInstance(
          contest.starting_virtual_money,
          Object.keys(contest.athletes).length);
    var contestant;
    if (contest.contestants.hasOwnProperty(user.username)) {
      contestant = {instances: [newContestantInstance]};
    }
    else {
      contestant = JSON.parse(contest.contestants[user.username]);
      contestant.instances.push(newContestantInstance);
    }
    contestant = JSON.stringify(contestant);

    async.parallel([
      function(callback) {
        setContestant(
          user.username, 
          contestant, 
          contest.current_entries, 
          contest.contest_id,
          callback);
      },
      function(callback) {
        subtractMoneyFromUser(user, contest, callback);
      }
    ],
    function (err) {
      if (err) {
        callback(err);
      }
      else {
        callback(null, contest.contest_id);
      }
    });

  }
}