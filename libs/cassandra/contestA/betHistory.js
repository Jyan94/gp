/**
 * ====================================================================
 * Author: Harrison Zhao
 * ====================================================================
 */
'use strict';
(require('rootpath')());

var cassandra = require('libs/cassandra/cql');
var configs = require('config/index.js');
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

var INSERT_BET_HISTORY_CQL = multiline(function() {/*
  INSERT INTO contest_a_bets_history (
    athlete_id,
    athlete_name,
    athlete_team,
    bet_id,
    fantasy_value,
    opponent,
    over_not_under,
    payoff,
    price,
    sell_not_buy,
    time,
    username
  ) VALUES (
    ?, ?, ?, ?, ?, 
    ?, ?, ?, ?, ?,
    ?, ?);
*/});
var FANTASY_VALUE_INDEX = 4;
var PAYOFF_INDEX = 7;
var PRICE_INDEX = 8;
function insert(params, callback) {
  params[FANTASY_VALUE_INDEX] = {
    value: params[FANTASY_VALUE_INDEX],
    hint: 'double'
  };
  params[PAYOFF_INDEX] = {
    value: params[PAYOFF_INDEX],
    hint: 'double'
  };
  params[PRICE_INDEX] = {
    value: params[PRICE_INDEX],
    hint: 'double'
  };
  cassandra.query(INSERT_BET_HISTORY_CQL, params, one, callback);
}

function insertHistory(
  athleteId,
  athleteName,
  athleteTeam,
  betId,
  fantasyValue,
  opponent,
  overNotUnder,
  payoff,
  price,
  sellNotBuy,
  username,
  callback) {

  insert(
  [
    athleteId, 
    athleteName,
    athleteTeam, 
    betId,
    fantasyValue, 
    opponent, 
    overNotUnder,
    payoff, 
    price, 
    sellNotBuy, 
    cql.types.timeuuid(),
    username
  ], callback);
}

var DELETE_BET_HISTORY_WITH_USERNAME_CQL = multiline(function() {/*
  DELETE FROM
    contest_a_bets_history
  WHERE
    username = ?;
*/});
function deleteUsingUsername(username, callback) {
  cassandra.query(
    DELETE_BET_HISTORY_WITH_USERNAME_CQL, 
    [username], 
    one, 
    callback);
}

var DELETE_BET_HISTORY_WITH_ID_CQL = multiline(function() {/*
  DELETE FROM
    contest_a_bets_history
  WHERE
    bet_id = ?;
*/});
function deleteUsingBetId(betId, callback) {
  cassandra.query(
    DELETE_BET_HISTORY_WITH_USERNAME_CQL,
    [betId],
    one,
    callback);
}

exports.insertHistory = insertHistory;
exports.deleteUsingUsername = deleteUsingUsername;
exports.deleteUsingBetId = deleteUsingBetId;