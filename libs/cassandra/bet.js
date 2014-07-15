'use strict';
(require('rootpath')());

var cassandra = require('libs/cassandra/cql');
var configs = require('config/index.js');
var cql = configs.cassandra.cql;
var multiline = require('multiline');
var one = cql.types.consistencies.one;
var states = configs.constants.contestAbets.STATES;

var PENDING = states.PENDING;
var ACTIVE = states.ACTIVE;
var LOCKED = states.LOCKED;
var PROCESSED = states.PROCESSED;
var EXPIRED = states.EXPIRED;
var MINUTES_IN_MILLISECOND = 60000;

var FANTASY_VALUE_INDEX = 4;
var LONG_RESELL_VALUE_INDEX = 11;
var SHORT_RESELL_VALUE_INDEX = 15;
var WAGER_INDEX = 17;

var INSERT_BET_CQL = multiline(function() {/*
  INSERT INTO contest_A_bets (
    athlete_id,
    bet_id timeuuid,
    bet_state,
    expiration,
    fantasy_value,
    game_id,
    is_selling_long_position,
    is_selling_short_position,
    long_better_id,
    long_better_username,
    long_better_resell_value,
    long_better_resell_expiration,
    short_better_id,
    short_better_username,
    short_better_resell_value,
    short_better_resell_expiration,
    wager
  ) VALUES (
    ?, ?, ?, ?, ?, 
    ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?,
    ?);
*/});
/**
 * inserts a contestA bet into database
 * @param  {array}   params
 * array of values for insertion into database
 * see above for fields
 * @param  {Function} callback
 * args (err)
 */
function insert(params, callback) {
  params[FANTASY_VALUE_INDEX] = {
    value: params[FANTASY_VALUE_INDEX],
    hint: 'double'
  };
  params[LONG_RESELL_VALUE_INDEX] = {
    value: params[LONG_RESELL_VALUE_INDEX],
    hint: 'double'
  };
  params[SHORT_RESELL_VALUE_INDEX] = {
    value: params[SHORT_RESELL_VALUE_INDEX],
    hint: 'double'
  };
  params[WAGER_INDEX] = {
    value: params[WAGER_INDEX],
    hint: 'double'
  };  
  cassandra.query(INSERT_BET_CQL, params, one, callback);
}

function insertPending(
  athleteId,
  betId,
  expirationTimeMinutes,
  fantasyValue,
  gameId,
  wager,
  userId,
  username,
  isLongBetter,
  callback) {

  var longBetterId = null;
  var longBetterUsername = null;
  var shortBetterId = null;
  var shortBetterUsername = null;
  var isSellingLongPosition = null;

  if (isLongBetter) {
    longBetterId = userId;
    longBetterUsername = username;
  }
  else {
    shortBetterId = userId;
    shortBetterUsername = username;
  }

  insert(
  [
    athleteId,
    betId,
    PENDING,
    new Date(
      ((new Date()).getTime()) + 
      (expirationTimeMinutes * MINUTES_IN_MILLISECOND)),
    fantasyValue,
    gameId,
    !isLongBetter,
    isLongBetter,
    longBetterId,
    longBetterUsername,
    null,
    null,
    shortBetterId,
    shortBetterUsername,
    null,
    null,
    wager
  ], 
  callback);
}

var TAKE_LONG_BETTER_CQL = multiline(function() {/*
  UPDATE
    contest_A_bets
  SET
    bet_state = ?,
    expiration = null,
    is_selling_long_position = false,
    long_better_id = ?,
    long_better_username = ?
  WHERE
    bet_id = ?
  IF
    bet_state = ?
  AND
    is_selling_long_position = true;
*/});
var TAKE_SHORT_BETTER_CQL = multiline(function() {/*
  UPDATE
    contest_A_bets
  SET
    bet_state = ?,
    expiration = null,
    is_selling_short_position = false,
    short_better_id = ?,
    short_better_username = ?
  WHERE
    bet_id = ?
  IF
    bet_state = ?
  AND
    is_selling_long_position = false;
*/});
function takePending(betId, userId, username, isLongBetter, callback) {
  var query;
  if (isLongBetter) {
    query = TAKE_LONG_BETTER_CQL;
  }
  else {
    query = TAKE_SHORT_BETTER_CQL;
  }
  cassandra.query(
    query, 
    [ACTIVE, userId, username, betId, PENDING],
    one,
    callback);
}

var RESELL_LONG_BETTER_CQL = multiline(function() {/*
  UPDATE
    contest_A_bets
  SET
    is_selling_long_position = true,
    long_better_resell_value = ?,
    long_better_resell_expiration = ?
  WHERE
    bet_id = ?
  IF
    bet_state = ?
  AND
    long_better_id = ?
  AND
    is_selling_long_position = false;
*/});

var RESELL_SHORT_BETTER_CQL = multiline(function() {/*
  UPDATE
    contest_A_bets
  SET
    is_selling_short_position = true,
    short_better_resell_value = ?,
    short_better_resell_expiration = ?
  WHERE
    bet_id = ?
  IF
    bet_state = ?
  AND
    short_better_id = ?
  AND
    is_selling_short_position = false;
*/});
function placeResell(
  betId, 
  userId, 
  expirationTime, 
  resellPrice, 
  isLongBetter, 
  callback) {

  var isResellingLongBetter = isLongBetter;
  var query;
  if (isResellingLongBetter) {
    query = RESELL_LONG_BETTER_CQL;
  }
  else {
    query = RESELL_SHORT_BETTER_CQL;
  }
  cassandra.query(
    query, 
    [
      resellPrice,
      new Date((new Date()).getTime()+expirationTime * MINUTES_IN_MILLISECOND),
      betId, 
      ACTIVE, 
      userId
    ],
    one,
    callback);
}

var TAKE_LONG_BETTER_RESELL_CQL = multiline(function() {/*
  UPDATE
    contest_A_bets
  SET
    is_selling_long_position = false,
    long_better_id = ?,
    long_better_username = ?,
    long_better_resell_value = null,
    long_better_resell_expiration = null
  WHERE
    bet_id = ?
  IF
    bet_state = ?
  AND
    is_selling_long_position = true;
*/});
var TAKE_SHORT_BETTER_RESELL_CQL = multiline(function() {/*
  UPDATE
    contest_A_bets
  SET
    is_selling_short_position = false,
    short_better_id = ?,
    short_better_username = ?,
    short_better_resell_value = null,
    short_better_resell_expiration = null
  WHERE
    bet_id = ?
  IF
    bet_state = ?
  AND
    is_selling_short_position = true;
*/});
function takeResell(betId, userId, username, isBuyingLongBetter, callback) {
  var query = null;
  if (isBuyingLongBetter) {
    query = TAKE_LONG_BETTER_CQL;
  }
  else {
    query = TAKE_SHORT_BETTER_CQL;
  }
  cassandra.query(
    query,
    [userId, username, betId, ACTIVE],
    one,
    callback);
}

var DELETE_LONG_BETTER_PENDING_CQL = multiline(function() {/*
  DELETE FROM 
    contest_A_bets
  WHERE
    bet_id = ?
  IF
    long_better_id = ?
  AND
    short_better_id = null;
*/});
var DELETE_SHORT_BETTER_PENDING_CQL = multiline(function() {/*
  DELETE FROM 
    contest_A_bets
  WHERE
    bet_id = ?
  IF
    short_better_id = ?
  AND
    long_better_id = null;
*/});
function deletePendingBet(betId, userId, isLongBetter, callback) {
  var query;
  if (isLongBetter) {
    query = DELETE_LONG_BETTER_PENDING_CQL;
  }
  else {
    query = DELETE_SHORT_BETTER_PENDING_CQL;
  }
  cassandra.query(query, [betId, userId], one, callback);
}

var DELETE_SHORT_BETTER_PENDING_CQL = multiline(function() {/*
  DELETE FROM 
    contest_A_bets
  WHERE
    bet_id = ?;
*/});
function deleteBet(betId, callback) {
  cassandra.query(DELETE_SHORT_BETTER_PENDING_CQL, [betId], one, callback);
}

var RECALL_LONG_BETTER_RESALE_CQL = multiline(function() {/*
  UPDATE
    contest_A_bets
  SET
    is_selling_long_position = false,
    short_better_resell_value = null,
    short_better_resell_expiration = null
  WHERE
    bet_id = ?
  IF
    bet_state = ?
  AND
    is_selling_short_position = true;
*/});
var RECALL_SHORT_BETTER_RESALE_CQL = multiline(function() {/*
  UPDATE
    contest_A_bets
  SET
    is_selling_short_position = false,
    short_better_resell_value = null,
    short_better_resell_expiration = null
  WHERE
    bet_id = ?
  IF
    bet_state = ?
  AND
    is_selling_short_position = false;
*/});
function recallResale(betId, userId, isLongBetter, callback) {
  var query;
  if (isLongBetter) {
    query = RECALL_LONG_BETTER_RESALE_CQL;
  }
  else {
    query = RECALL_SHORT_BETTER_RESALE_CQL;
  }
  cassandra.query(query, [betId, userId], one, callback);

}