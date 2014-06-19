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
var ContestEntries = require('libs/contest/countEntries');
var async = require('async');
var extend = require('node.extend');

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
    entry_fee,
    game_type,
    pay_outs,
    processed_payouts_time,
    sport,
    starting_virtual_money,
    total_prize_pool
  ) VALUES (
    ?, ?, ?, ?, ?, 
    ?, ?, ?, ?, ?, 
    ?, ?, ?, ?, ?
  );
*/});

/**
 * initialize contest by inserting into contest_count_entries and contest_B
 * @param  {Array of arrays}   settings
 * contains array for entry table and contest_b table initialization params
 * settings must be in correct format
 * @param  {Function} callback [description]
 */
var ENTRIES_INDEX = 0;
var MODE_INDEX = 1;
exports.insert  = function(settings, callback) {
  var query = [
    {
      query: ContestEntries.INSERT_CONTEST_QUERY,
      params: settings[ENTRIES_INDEX]
    },
    {
      query: INSERT_CONTEST_QUERY,
      params: settings[MODE_INDEX]
    }
  ];
  cassandra.queryBatch(
    query, 
    cql.types.consistencies.quorum,
    function (err) {
      callback(err);
    });
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
  var query = [
    {
      query: ContestEntries.DELETE_CONTEST_QUERY,
      params: []
    },
    {
      query: DELETE_CONTEST_QUERY,
      params: []
    }
  ];
  cassandra.queryBatch(
    query, 
    cql.types.consistencies.quorum,
    function (err) {
      callback(err);
    });
};

/*
 * ====================================================================
 * SELECT QUERIES
 * ====================================================================
 */
function sortById(array, callback) {
  callback(
    null, 
    array.sort(function(instanceA, instanceB) {
      return instanceA.contest_id.localeCompare(instanceB.contest_id);
    })
  );
}

function mergeToSingleArray(entries, contests, callback) {
  async.map([entries, contests], sortById, function(err, result) {
    for (var i = 0; i !== result[0].length; ++i) {
      extend(result[1][i], result[0][i]);
    }
    callback(null, result[1]);
  });
}

function sortAndMerge(entries, contests, callback) {
  async.parallel([entries, contests], sortById, function(err, result) {
    mergeToSingleArray(result[0], result[1], callback);
  });
}

function selectByNonIdField(otherIdQueryFunction, retCallback) {
  async.waterfall([
    otherIdQueryFunction,
    function(contests, callback) {
      ContestEntries.selectFromContestsArray(
        contests,
        function(err, result) {
          if (err) {
            callback(err);
          }
          callback(null, result, contests);
        });
    },
    function(entries, contests, callback) {
      sortAndMerge(entries, contests, function(err, result) {
        callback(err, result);
      });
    }
  ], 
  retCallback);
}

function selectContestByQuery(statement, params, retCallback) {
  var query = function(callback) {
    cassandra.query(
      query,
      params,
      cql.types.consistency.one,
      function(err, result) {
        if(err) {
          callback(err);
        }
        callback(null, result);
      });
  }
  selectByNonIdField(query, retCallback);
}

var SELECT_CONTEST_ID_QUERY = multiline(function() {/*
  SELECT * 
    FROM contest_B 
    WHERE contest_id = ?;
*/});

function selectByContestId(contestId, callback) {
  cassandra.query(
    SELECT_CONTEST_ID_QUERY, 
    [contestId],
    cql.types.consistency.one,
    callback);
}

exports.selectById = function(contestId, retCallback) {
  async.parallel([
    function(callback) {
      ContestEntries.select(contestId, callback);
    },
    function(callback) {
      selectByContestId(contestId, callback);
    }
  ], 
  function (err, result) {
    sortAndMerge(result[0], result[1], retCallback);
  });
}

var SELECT_USERNAME_QUERY = multiline(function() {/*
  SELECT * 
    FROM contest_B 
    WHERE contestants CONTAINS KEY ?;
*/});

exports.selectByUsername = function(username, retCallback) {
  selectContestByQuery(SELECT_USERNAME_QUERY, [username], retCallback);
}

var SELECT_OPEN_QUERY = multiline(function() {/*
  SELECT *
    FROM contest_B
    WHERE sport = ? AND state = 0;
*/});

exports.selectByOpen = function(sport, retCallback) {
  selectContestByQuery(SELECT_OPEN_QUERY, [sport], retCallback);
}

var SELECT_CONTESTS_TO_PROCESS_QUERY = multiline(function(){/*
  SELECT *
    FROM contest_B
    WHERE sport = ? AND state = 2;
*/});
exports.selectByContestsToProcess = function(sport, retCallback) {
  selectContestByQuery(
    SELECT_CONTESTS_TO_PROCESS_QUERY, 
    [sport], 
    retCallback);
}

var SELECT_CANCELLED_QUERY = multiline(function() {/*
  SELECT *
    FROM contest_B
    WHERE sport = ? AND state = 4;
*/});

exports.selectByContestsToProcess = function(sport, retCallback) {
  selectContestByQuery(SELECT_CANCELLED_QUERY, [sport], retCallback);
}

var ADD_CONTESTANT_QUERY = multiline(function() {/*
  UPDATE 
    contest_B
  SET 
    contestants['?'].instances = contestant['?'].instances + ?
  WHERE
    contestId = ?
*/});

var NEW_CONTESTANT_INSTANCE = {
  virtual_money_remaining : 0,
  bets : {} 
};

/**
 * first checks if tournament is full
 * checks if username is already in contest and if it is, appends another
 * newly initialized contestant instance
 * uses a batch query
 * @param {[type]}   username  [description]
 * @param {[type]}   contestId [description]
 * @param {Function} callback  [takes as parameters (err, result)]
 */
exports.addContestant = function(username, contestId, callback) {
  var query = [
    {
      query: ContestEntries.INCREMENT_CONTESTANTS_QUERY,
      params: [contestId]
    },
    {
      query: ADD_CONTESTANT_QUERY,
      params: [username, username, NEW_CONTESTANT_INSTANCE, contestId]
    }
  ];
  cassandra.queryBatch(query, cql.types.consistencies.quorum, 
    function(err, result) {
      if (err) {
        callback(err);
      }
      if (!result) {
        callback(new Error('contest full'));
      }
      else {
        callback(null);
      }
    });
}

var REMOVE_CONTESTANT_QUERY = multiline(function() {/*
  DELETE
    contestants['?'].instances[?]
  FROM
    contest_B
  WHERE
    contest_id = ?;
*/});

exports.removeContestantInstance = function(
  username, instanceIndex, contestId, callback) {
  var query = [
    {
      query: ContestEntries.DECREASE_CONTESTANTS_QUERY,
      params: [contestId]
    },
    {
      query: REMOVE_CONTESTANT_QUERY,
      params: [username, instanceIndex, contestId]
    }
  ];
  cassandra.queryBatch(query, cql.types.consistencies.quorum, 
    function(err, result) {
      if (err) {
        callback(err);
      }
      callback(null);
    });
}

var UPDATE_CONTESTANT_QUERY = multiline(function() {/*
  UPDATE
    contest_B
  SET
    contestants['?'].instances[?] = ?
  WHERE
    contest_id = ?;
*/});

exports.updateContestantInstance = function() {

}
/**
 * batch query
 * query1: update num entries
 * query2: update contest by adding user
 */

exports.removeContestant = function(
  contestantInstanceId, 
  username, 
  contestId,
  callback) {

};

exports.updateContestant = function(
  contestantInstanceObject,
  contestantInstanceIndex,
  username,
  contestId,
  callback) {

};