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
var quorum = cql.types.consistencies.quorum;
var one = cql.types.consistencies.one;

var MAX_MILLISECONDS = 30000;
var MAX_TRIES = 30;
var MAX_WAIT = 1000;
var ZERO_TRIES = 0;

var OBTAIN_LOCK_QUERY = multiline(function() {/*
  UPDATE
    contest_B
  SET
    last_locked = now(),
    lock_insert_delete = true
  WHERE
    contest_id = ?
  IF
    lock_insert_delete = false;
*/});

var READ_LAST_LOCKED_QUERY = multiline(function(){/*
  SELECT
    last_locked
  FROM
    contest_B
  WHERE
    contest_id = ?;
*/});

var OVERRIDE_LOCK_QUERY = multiline(function() {/*
  UPDATE
    contest_B
  SET
    lock_insert_delete = true;
  WHERE
    contest_id = ?
*/});

var RELEASE_LOCK_QUERY = multiline(function() {/*
  UPDATE
    contest_B
  SET
    lock_insert_delete = false
  WHERE
    contest_id = ?
*/});

var SET_CONTESTANT_QUERY = multiline(function() {/*
  UPDATE 
    contest_B
  SET 
    contestants['?'] = ?,
    current_entries = ?
  WHERE
    contestId = ?
*/});

function setContestant(
  username, 
  contestant, 
  numEntries, 
  contestId, 
  callback) {

  cassandra.query(
    SET_CONTESTANT_QUERY, 
    [username, contestant, numEntries, contestId],
    quorum,
    callback);

}

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

function tryOverrideLock(user, contestId, tries, obtainLock, callback) {

  cassandra.queryOneRow(
    READ_LAST_LOCKED_QUERY, 
    [contestId], 
    quorum, 
    function(err, result) {
      var lastLockedPlusTime = 
        new Date(result.last_locked.getTime() + MAX_MILLISECONDS);
      if (err) {
        callback(err);
      }
      else if (+(new Date()) < +lastLockedPlusTime) {

        cassandra.query(
          OVERRIDE_LOCK_QUERY, 
          [contestId], 
          quorum,
          function (err) {
            if (err) {
              callback(err);
            }
            else {
              callback(null);
            }
          });

      }
      else {
        obtainLock(user, contestId, tries + 1, callback);
      }
    });

}

function obtainLock(user, contestId, tries, callback) {
  cassandra.queryOneRow(
    OBTAIN_LOCK_QUERY, 
    [contestId], 
    quorum, 
    function(err, result){
      if (err) {
        callback(err);
      }
      else if (result['[applied]']) {
        callback(null, user, contestId);
      }
      else if (tries > MAX_TRIES) {
        tryOverrideLock(user, contestId, tries, obtainLock, callback);
      }
      else {
        var random = Math.round(Math.random() * MAX_WAIT);
        obtainLock(user, contestId, tries + 1, callback);
      }
  });
}

function readContest(user, contestId, callback) {
  exports.selectById(contestId, function(err, result) {
    if (err) {
      callback(err);
    }
    else {
      callback(null, user, result);
    }
  });
}

function releaseLock(contestId, callback) {
  cassandra.query(RELEASE_LOCK_QUERY, [contestId], quorum, callback)
}

/**
 * obtains a lock on adding / removing users for a given contest
 * read the contest
 * adds user to the contest
 * releases lock
 * subtracts money from user
 * @param {Object}   user
 * req.user passport object, contains username and money fields
 * @param {uuid}   contestId
 * @param {Function} callback  [description]
 */
exports.addContestant = function(user, contestId, callback) {
  async.waterfall([
    function(callback) {
      callback(null, user, contestId, ZERO_TRIES);
    },
    obtainLock,
    readContest,
    addUserInstanceToContest,
    releaseLock
  ], 
  callback);
}

var REMOVE_CONTESTANT_QUERY = multiline(function() {/*
  DELETE
    contestants['?'].instances[?]
  FROM
    contest_B
  WHERE
    contest_id = ?;
*/});

function removeInstanceFromContest(user, contest, instanceIndex, callback) {
  var cont
  var queries = [
  {
    query: REMOVE_CONTESTANT_QUERY,
    params: [contest.contest_id]
  },
  {
    query: 
  }
  ];
}

exports.removeContestantInstance = function(
  user, instanceIndex, contestId, callback) {
  async.waterfall([
    function(callback) {
      callback(null, user, contestId, ZERO_TRIES);
    },
    obtainLock,
    readContest,
    function(user, contest, callback) {

    },
    releaseLock
  ],
  callback)
}

var UPDATE_CONTESTANT_QUERY = multiline(function() {/*
  UPDATE
    contest_B
  SET
    contestants['?'].instances[?] = ?
  WHERE
    contest_id = ?;
*/});

exports.updateContestantInstance = function(updatedInstance) {

}