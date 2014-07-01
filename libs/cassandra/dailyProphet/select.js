/**
 * ====================================================================
 * Author: Harrison Zhao
 * ====================================================================
 */
'use strict';
(require('rootpath')());

var cassandra = require('libs/cassandra/cql');
var configs = require('config/index.js');
var async = require('async');
var multiline = require('multiline');

var cql = configs.cassandra.cql;
var states = configs.constants.dailyProphet;
var quorum = cql.types.consistencies.quorum;
var one = cql.types.consistencies.one;

var OPEN = states.OPEN;
var FILLED = states.FILLED;
var TO_PROCESS = states.TO_PROCESS;
var PROCESSED = states.PROCESSED;
var CANCELLED = states.CANCELLED;
var SEMICOLON = ';';

/*
 * ====================================================================
 * SELECT QUERIES AND HELPERS
 * ====================================================================
 */

var SELECT_CONTEST_ID_QUERY = multiline(function() {/*
  SELECT * 
    FROM daily_prophet 
    WHERE contest_id = ?;
*/});

/**
 * @param  {timeuuid}   contestId
 * @param  {Function} callback
 * args: (err, result)
 * result is a row object
 */
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
    FROM daily_prophet 
    WHERE contestants CONTAINS KEY '
*/});

var SELECT_USERNAME_QUERY_2 = multiline(function() {/*
';
*/});

/**
 * @param  {string}   username
 * @param  {Function} callback
 * args: (err, result)
 * result is a row object
 */
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
    FROM daily_prophet
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
    FROM daily_prophet
    WHERE sport = ?;
*/});

/**
 * @param  {string}   sport
 * @param  {Function} callback
 * args: (err, results)
 * where results is an array of rows
 */
exports.selectBySport = function(sport, callback) {
  cassandra.query(SELECT_BY_SPORT_QUERY, [sport], one, callback);
}

var SELECT_OPEN_BY_ATHLETE_1 = multiline(function() {/*
  SELECT *
    FROM daily_prophet
    WHERE athlete_names CONTAINS '
*/});

var SELECT_OPEN_BY_ATHLETE_2 = multiline(function() {/*
';
*/});

/**
 * returns all open contests with the given athlete name
 * prevents against cql injection by preventing against semicolon insertion
 * @param  {string}   athleteName
 * @param  {Function} callback
 * args: (err, results)
 * where results is an array of rows
 * if there are no results, returns an empty array
 */
exports.selectOpenByAthlete = function(athleteName, callback) {
  if(athleteName.indexOf(SEMICOLON) === -1) {
    var SELECT_OPEN_BY_ATHLETE = SELECT_OPEN_BY_ATHLETE_1;
    SELECT_OPEN_BY_ATHLETE += athleteName;
    SELECT_OPEN_BY_ATHLETE += SELECT_OPEN_BY_ATHLETE_2;
    async.waterfall([
      function(callback) {
        cassandra.query(SELECT_OPEN_BY_ATHLETE, [], one, callback);
      },
      function(contests, callback) {
        async.filter(contests, function(contest, callback) {
          callback(contest.contest_state === OPEN);
        }, function (results) {
          callback(null, results);
        });
      }
    ], callback);
  }
  else {
    callback(new Error('invalid name request'));
  }
}