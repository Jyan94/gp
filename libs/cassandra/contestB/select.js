/**
 * ====================================================================
 * Author: Harrison Zhao
 * ====================================================================
 */
'use strict';
(require('rootpath')());

var cassandra = require('libs/cassandra/cql');
var configs = require('config/index.js');
var multiline = require('multiline');

var cql = configs.cassandra.cql;
var states = configs.constants.contestB;
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


var SELECT_USERNAME_QUERY_1 = multiline(function() {/*
  SELECT * 
    FROM contest_B 
    WHERE contestants CONTAINS KEY '
*/});

var SELECT_USERNAME_QUERY_2 = multiline(function() {/*
';
*/});

exports.selectByUsername = function(username, callback) {
  var SELECT_USERNAME_QUERY = SELECT_USERNAME_QUERY_1;
  SELECT_USERNAME_QUERY += username;
  SELECT_USERNAME_QUERY += SELECT_USERNAME_QUERY_2;
  cassandra.query(
    SELECT_USERNAME_QUERY, 
    [], 
    one,     
    function (err, result) {
      if (err) {
        callback(err);
      }
      else if (!result) {
        callback(new Error('contests not found'));
      }
      else {
        callback(null, result);
      }
    });
}


var SELECT_BY_STATE_QUERY = multiline(function() {/*
  SELECT *
    FROM contest_B
    WHERE contest_state = ?;
*/});

function selectByState(state, callback) {
  cassandra.query(SELECT_BY_STATE_QUERY, [state], one, callback);
}

exports.selectOpen = function(callback) {
  selectByState(OPEN, callback);
}

exports.selectFilled = function(callback) {
  selectByState(FILLED, callback);
}

exports.selectContestsToProcess = function(callback) {
  selectByState(TO_PROCESS, callback);
}

exports.selectProcessed = function(callback) {
  selectByState(PROCESSED, callback);
}

exports.selectCancelled = function(callback) {
  selectByState(CANCELLED, callback);
}

var SELECT_BY_SPORT_QUERY = multiline(function() {/*
  SELECT *
    FROM contest_B
    WHERE sport = ?;
*/});

exports.selectBySport = function(sport, callback) {
  cassandra.query(SELECT_BY_SPORT_QUERY, [sport], one, callback);
}