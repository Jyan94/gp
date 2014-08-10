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
var cql = configs.cassandra.cql;
var multiline = require('multiline');
var one = cql.types.consistencies.one;
var states = configs.constants.contestAbets.STATES;
var OVER = configs.constants.contestAbets.POSITIONS.OVER;
var UNDER = configs.constants.contestAbets.POSITIONS.UNDER;
var MINUTES_IN_MILLISECONDS = configs.constants.globals.MINUTES_IN_MILLISECONDS;
var DEFAULT_USERNAME = configs.constants.contestAbets.DEFAULT_USERNAME;
var SEMICOLON = configs.constants.globals.SEMICOLON;

var PENDING = states.PENDING;
var ACTIVE = states.ACTIVE;
var PROCESSED = states.PROCESSED;
var EXPIRED = states.EXPIRED;

var SELECT_BET_BY_ID_CQL = multiline(function(){/*
  SELECT * FROM contest_A_bets WHERE bet_id = ?;
*/});

function selectByBetId(betId, callback) {
  cassandra.queryOneRow(SELECT_BET_BY_ID_CQL, [betId], one, callback);
}

function createSelectByUsernameQuery(username) {
  return
    'SELECT * FROM contest_A_bets WHERE bettor_usernames CONTAINS \'' +
    username +
    '\';';
}
function selectByUsername(username, callback) {
  if(username.indexOf(SEMICOLON) === -1) {
    var query = createSelectByUsernameQuery(username);
    cassandra.query(query, [], one, callback);
  }
  else {
    callback(new Error('invalid username request'));
  }
}

var SELECT_BETS_BY_STATE_CQL = multiline(function(){/*
  SELECT *
  FROM contest_A_bets
  WHERE bet_state = ?;
*/});
function selectBetsByState(state, callback) {
  cassandra.query(SELECT_BETS_BY_STATE_CQL, [state], one, callback);
}

function selectPendingBets(callback) {
  selectBetsByState(PENDING, callback);
}

function selectActiveBets(callback) {
  selectBetsByState(ACTIVE, callback);
}

function selectProcessedBets(callback) {
  selectBetsByState(PROCESSED, callback);
}

function selectExpiredBets(callback) {
  selectBetsByState(EXPIRED, callback);
}

exports.selectByBetId = selectByBetId;
exports.selectByUsername = selectByUsername;

exports.selectPendingBets = selectPendingBets;
exports.selectActiveBets = selectActiveBets;
exports.selectProcessedBets = selectProcessedBets;
exports.selectExpiredBets = selectExpiredBets;