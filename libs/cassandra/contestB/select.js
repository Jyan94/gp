/**
 * ====================================================================
 * Author: Harrison Zhao
 * ====================================================================
 */
'use strict';
(require('rootpath')());

var cassandra = require('libs/cassandra/cql');
var cql = require('config/index.js').cassandra.cql;
var states = require('config/constants').contestB;
var multiline = require('multiline');
var quorum = cql.types.consistencies.quorum;
var one = cql.types.consistencies.one;

var OPEN = states.OPEN;
var FILLED = states.FILLED;
var TO_PROCESS = states.TO_PROCESS;
var PROCESSED = states.PROCESSED;
var CANCELLED = states.CANCELLED;

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
  cassandra.queryOneRow(
    SELECT_CONTEST_ID_QUERY, 
    [contestId], 
    one,
    function (err, result) {
      if (err) {
        callback(err);
      }
      else if (!result) {
        callback(new Error('contest not found'));
      }
      else {
        callback(null, result);
      }
    });
};

var SELECT_USERNAME_QUERY = multiline(function() {/*
  SELECT * 
    FROM contest_B 
    WHERE contestants CONTAINS KEY ?;
*/});

exports.selectByUsername = function(username, callback) {
  cassandra.query(
    SELECT_USERNAME_QUERY, 
    [username], 
    one,     
    function (err, result) {
      if (err) {
        callback(err);
      }
      else if (!result) {
        callback(new Error('contest not found'));
      }
      else {
        callback(null, result);
      }
    });
}

var SELECT_BY_STATE_QUERY = multiline(function() {/*
  SELECT *
    FROM contest_B
    WHERE sport = ? AND contest_state = ?;
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
