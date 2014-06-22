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
var one = cql.types.consistencies.one;

var OPEN = 0;
var FILLED = 1;
var TO_PROCESS = 2;
var PROCESSED = 3;
var CANCELLED = 4;
var MAX_MILLISECONDS = 30000;
var MAX_TRIES = 30;
var MAX_WAIT = 1000;
var ZERO_TRIES = 0;
/** 
 * ====================================================================
 *  INSERT QUERY
 * ====================================================================
 */
var INSERT_CONTEST_QUERY = multiline(function() {/*
  INSERT INTO contest_B (
    athletes,
    commission,
    contest_deadline_time,
    contest_end_time,
    contest_id,
    contest_start_time,
    contest_state,
    contestants,
    current_entries,
    entries_allowed_per_contestant,
    entry_fee,
    game_type,
    last_locked,
    lock_insert_delete,
    maximum_entries,
    minimum_entries
    pay_outs,
    processed_payouts_time,
    sport,
    starting_virtual_money,
    total_prize_pool
  ) VALUES (
    ?, ?, ?, ?, ?, 
    ?, ?, ?, ?, ?, 
    ?, ?, ?, ?, ?,
    ?. ?. ?, ?, ?,
    ?
  );
*/});

/**
 * initialize contest by inserting into contest_count_entries and contest_B
 * @param  {array}   settings
 * contains array for contest_b entry initialization params
 * @param  {Function} callback
 * parameters (err)
 */
exports.insert  = function(settings, callback) {
  cassandra.query(INSERT_CONTEST_QUERY, settings, quorum, callback);
};

/* 
 * ====================================================================
 * DELETE QUERY
 * ====================================================================
 */
var DELETE_CONTEST_QUERY = multiline(function() {/*
  DELETE 
    FROM contest_B 
    WHERE contest_id = ?;
*/});

exports.delete = function(contestId, callback) {
  cassandra.query(DELETE_CONTEST_QUERY, [contestId], quorum, callback);
};

/*
 * ====================================================================
 * SELECT QUERIES AND HELPERS
 * ====================================================================
 */

var SELECT_CONTEST_ID_QUERY = multiline(function() {/*
  SELECT * 
    FROM contest_B 
    WHERE contest_id = ?;
*/});

exports.selectById = function(contestId, callback) {
  cassandra.queryOneRow(SELECT_CONTEST_ID_QUERY, [contestId], one, callback);
};

var SELECT_USERNAME_QUERY = multiline(function() {/*
  SELECT * 
    FROM contest_B 
    WHERE contestants CONTAINS KEY ?;
*/});

exports.selectByUsername = function(username, callback) {
  cassandra.query(SELECT_USERNAME_QUERY, [username], one, callback);
}

var SELECT_BY_STATE_QUERY = multiline(function() {/*
  SELECT *
    FROM contest_B
    WHERE sport = ? AND state = ?;
*/});

function selectByState(sport, state, callback) {
  cassandra.query(SELECT_BY_STATE_QUERY, [sport, state], one, callback);
}

exports.selectOpen = function(sport, callback) {
  selectByState(sport, OPEN, callback);
}

exports.selectFilled = function(sport, callback) {
  selectByState(sport, FILLED, callback);
}

exports.selectContestsToProcess = function(sport, callback) {
  selectByState(sport, TO_PROCESS, callback);
}

exports.selectProcessed = function(sport, callback) {
  selectByState(sport, PROCESSED, callback);
}

exports.selectCancelled = function(sport, callback) {
  selectByState(sport, CANCELLED, callback);
}

/*
 * ====================================================================
 * UPDATE QUERIES
 * ====================================================================
 */

var UPDATE_STATE_QUERY = multiline(function() {/*
  UPDATE 
    contest_B
  SET 
    state = ?
  WHERE
    contestId = ?
*/});

function updateContestState(nextState, contestId, callback) {
  cassandra.query(UPDATE_STATE_QUERY, [nextState, contestId], quorum, callback);
}

exports.setOpen = function(contestId, callback) {
  updateContestState(OPEN, contestId, callback);
}

exports.setFilled = function(contestId, callback) {
  updateContestState(FILLED, contestId, callback);
}

exports.setToProcess = function(contestId, callback) {
  updateContestState(TO_PROCESS, contestId, callback);
}

exports.setProcessed = function(contestId, callback) {
  updateContestState(PROCESSED, contestId, callback);
}

exports.setCancelled = function(contestId, callback) {
  updateContestState(CANCELLED, contestId, callback);
}

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
/*
      for (var i = 0; result.athletes.hasOwnProperty(i); ++i) {
        result.athletes[i] = JSON.parse(result.athletes[i]);
      }
*/
function removeInstanceFromContest(user, contest, instanceIndex, callback) {
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