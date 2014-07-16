'use strict';
(require('rootpath')());

var cassandra = require('libs/cassandra/cql');
var configs = require('config/index.js');
var async = require('async');
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
var OVER_RESELL_VALUE_INDEX = 11;
var UNDER_RESELL_VALUE_INDEX = 15;
var WAGER_INDEX = 17;

var INSERT_BET_CQL = multiline(function() {/*
  INSERT INTO contest_A_bets (
    athlete_id,
    bet_id,
    bet_state,
    expiration,
    fantasy_value,
    game_id,
    is_selling_over_position,
    is_selling_under_position,
    over_better_id,
    over_better_username,
    over_better_resell_expiration,
    over_better_resell_value,
    under_better_id,
    under_better_username,
    under_better_resell_expiration,
    under_better_resell_value,
    wager
  ) VALUES (
    ?, ?, ?, ?, ?, 
    ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?,
    ?, ?);
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
  params[OVER_RESELL_VALUE_INDEX] = {
    value: params[OVER_RESELL_VALUE_INDEX],
    hint: 'double'
  };
  params[UNDER_RESELL_VALUE_INDEX] = {
    value: params[UNDER_RESELL_VALUE_INDEX],
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

  var overBetterId = null;
  var overBetterUsername = null;
  var underBetterId = null;
  var underBetterUsername = null;
  var isSellingLongPosition = null;

  if (isLongBetter) {
    overBetterId = userId;
    overBetterUsername = username;
  }
  else {
    underBetterId = userId;
    underBetterUsername = username;
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
    overBetterId,
    overBetterUsername,
    null,
    null,
    underBetterId,
    underBetterUsername,
    null,
    null,
    wager
  ], 
  callback);
}

var TAKE_OVER_BETTER_CQL = multiline(function() {/*
  UPDATE
    contest_A_bets
  SET
    bet_state = ?,
    expiration = null,
    is_selling_over_position = false,
    over_better_id = ?,
    over_better_username = ?
  WHERE
    bet_id = ?
  IF
    bet_state = ?
  AND
    is_selling_over_position = true;
*/});
var TAKE_UNDER_BETTER_CQL = multiline(function() {/*
  UPDATE
    contest_A_bets
  SET
    bet_state = ?,
    expiration = null,
    is_selling_under_position = false,
    under_better_id = ?,
    under_better_username = ?
  WHERE
    bet_id = ?
  IF
    bet_state = ?
  AND
    is_selling_over_position = false;
*/});
function takePending(betId, userId, username, isLongBetter, callback) {
  var query;
  if (isLongBetter) {
    query = TAKE_OVER_BETTER_CQL;
  }
  else {
    query = TAKE_UNDER_BETTER_CQL;
  }
  cassandra.query(
    query, 
    [ACTIVE, userId, username, betId, PENDING],
    one,
    callback);
}

var RESELL_OVER_BETTER_CQL = multiline(function() {/*
  UPDATE
    contest_A_bets
  SET
    is_selling_over_position = true,
    over_better_resell_value = ?,
    over_better_resell_expiration = ?
  WHERE
    bet_id = ?
  IF
    bet_state = ?
  AND
    over_better_id = ?
  AND
    is_selling_over_position = false;
*/});

var RESELL_UNDER_BETTER_CQL = multiline(function() {/*
  UPDATE
    contest_A_bets
  SET
    is_selling_under_position = true,
    under_better_resell_value = ?,
    under_better_resell_expiration = ?
  WHERE
    bet_id = ?
  IF
    bet_state = ?
  AND
    under_better_id = ?
  AND
    is_selling_under_position = false;
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
    query = RESELL_OVER_BETTER_CQL;
  }
  else {
    query = RESELL_UNDER_BETTER_CQL;
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

var TAKE_OVER_BETTER_RESELL_CQL = multiline(function() {/*
  UPDATE
    contest_A_bets
  SET
    is_selling_over_position = false,
    over_better_id = ?,
    over_better_username = ?,
    over_better_resell_value = null,
    over_better_resell_expiration = null
  WHERE
    bet_id = ?
  IF
    bet_state = ?
  AND
    is_selling_over_position = true;
*/});
var TAKE_UNDER_BETTER_RESELL_CQL = multiline(function() {/*
  UPDATE
    contest_A_bets
  SET
    is_selling_under_position = false,
    under_better_id = ?,
    under_better_username = ?,
    under_better_resell_value = null,
    under_better_resell_expiration = null
  WHERE
    bet_id = ?
  IF
    bet_state = ?
  AND
    is_selling_under_position = true;
*/});
function takeResell(betId, userId, username, isBuyingLongBetter, callback) {
  var query = null;
  if (isBuyingLongBetter) {
    query = TAKE_OVER_BETTER_CQL;
  }
  else {
    query = TAKE_UNDER_BETTER_CQL;
  }
  cassandra.query(
    query,
    [userId, username, betId, ACTIVE],
    one,
    callback);
}

var DELETE_OVER_BETTER_PENDING_CQL = multiline(function() {/*
  DELETE FROM 
    contest_A_bets
  WHERE
    bet_id = ?
  IF
    bet_state = ?
  AND
    over_better_id = ?
  AND
    under_better_id = null;
*/});
var DELETE_UNDER_BETTER_PENDING_CQL = multiline(function() {/*
  DELETE FROM 
    contest_A_bets
  WHERE
    bet_id = ?
  IF
    bet_state = ?
  AND
    under_better_id = ?
  AND
    over_better_id = null;
*/});
function deletePendingBet(betId, userId, isLongBetter, callback) {
  var query;
  if (isLongBetter) {
    query = DELETE_OVER_BETTER_PENDING_CQL;
  }
  else {
    query = DELETE_UNDER_BETTER_PENDING_CQL;
  }
  cassandra.query(query, [betId, PENDING, userId], one, callback);
}

var DELETE_UNDER_BETTER_PENDING_CQL = multiline(function() {/*
  DELETE FROM 
    contest_A_bets
  WHERE
    bet_id = ?;
*/});
function deleteBet(betId, callback) {
  cassandra.query(DELETE_UNDER_BETTER_PENDING_CQL, [betId], one, callback);
}

var RECALL_OVER_BETTER_RESELL_CQL = multiline(function() {/*
  UPDATE
    contest_A_bets
  SET
    is_selling_over_position = false,
    under_better_resell_value = null,
    under_better_resell_expiration = null
  WHERE
    bet_id = ?
  IF
    bet_state = ?
  AND
    is_selling_under_position = true;
*/});
var RECALL_UNDER_BETTER_RESELL_CQL = multiline(function() {/*
  UPDATE
    contest_A_bets
  SET
    is_selling_under_position = false,
    under_better_resell_value = null,
    under_better_resell_expiration = null
  WHERE
    bet_id = ?
  IF
    bet_state = ?
  AND
    is_selling_under_position = false;
*/});
function recallResell(betId, userId, isLongBetter, callback) {
  var query;
  if (isLongBetter) {
    query = RECALL_OVER_BETTER_RESELL_CQL;
  }
  else {
    query = RECALL_UNDER_BETTER_RESELL_CQL;
  }
  cassandra.query(query, [betId, userId], one, callback);
}

var SELECT_BET_BY_OVER_BETTER_USER_ID = multiline(function(){/*
  SELECT * FROM contest_A_bets WHERE over_better_id = ?;
*/});
var SELECT_BET_BY_UNDER_BETTER_USER_ID = multiline(function(){/*
  SELECT * FROM contest_A_bets WHERE under_better_id = ?;
*/});
/*
function selectByUserId(userId, callback) {
  var getContests = function
  async.parallel(
  [
  ])
}*/