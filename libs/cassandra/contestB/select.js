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

var OPEN = 0;
var FILLED = 1;
var TO_PROCESS = 2;
var PROCESSED = 3;
var CANCELLED = 4;

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
