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
var constants = configs.constants;
var states = constants.contestAbets.STATES;
var OVER = constants.contestAbets.POSITIONS.OVER;
var UNDER = constants.contestAbets.POSITIONS.UNDER;
var MINUTES_IN_MILLISECONDS = constants.globals.MINUTES_IN_MILLISECONDS;
var DEFAULT_USERNAME = constants.contestAbets.DEFAULT_USERNAME;
var APPLIED = constants.cassandra.APPLIED;

var PENDING = states.PENDING;
var ACTIVE = states.ACTIVE;
var PROCESSED = states.PROCESSED;
var EXPIRED = states.EXPIRED;

var INSERT_BET_CQL = multiline(function() {/*
  INSERT INTO contest_a_bets (
    athlete_id,
    athlete_name,
    athlete_team,
    bet_id,
    bet_state,
    bettor_usernames,
    expirations,
    fantasy_value,
    game_id,
    is_selling_position,
    old_prices,
    payoff,
    prices,
    sport
  ) VALUES (
    ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?,
    ?, ?, ?, ?);
*/});

var bettor_usernames_INDEX = 5;
var EXPIRATIONS_INDEX = 6;
var FANTASY_VALUE_INDEX = 7;
var IS_SELLING_POSITION_INDEX = 9;
var OLD_PRICES_INDEX = 10;
var PAYOFF_INDEX = 11;
var PRICES_INDEX = 12;

/**
 * inserts a contestA bet into database
 * @param  {array}   params
 * array of values for insertion into database
 * see above for fields
 * @param  {Function} callback
 * args (err)
 */
function insert(params, callback) {
  params[bettor_usernames_INDEX] = {
    value: params[bettor_usernames_INDEX],
    hint: 'list'
  };
  params[EXPIRATIONS_INDEX] = {
    value: params[EXPIRATIONS_INDEX],
    hint: 'list'
  };
  params[FANTASY_VALUE_INDEX] = {
    value: params[FANTASY_VALUE_INDEX],
    hint: 'double'
  };
  params[IS_SELLING_POSITION_INDEX] = {
    value: params[IS_SELLING_POSITION_INDEX],
    hint: 'list'
  };
  params[PAYOFF_INDEX] = {
    value: params[PAYOFF_INDEX],
    hint: 'double'
  };

  params[OLD_PRICES_INDEX][OVER] = {
    value: params[OLD_PRICES_INDEX][OVER],
    hint: 'double'
  };
  params[OLD_PRICES_INDEX][UNDER] = {
    value: params[OLD_PRICES_INDEX][UNDER],
    hint: 'double'
  };
  params[OLD_PRICES_INDEX] = {
    value: params[OLD_PRICES_INDEX],
    hint: 'list'
  };

  params[PRICES_INDEX][OVER] = {
    value: params[PRICES_INDEX][OVER],
    hint: 'double'
  };
  params[PRICES_INDEX][UNDER] = {
    value: params[PRICES_INDEX][UNDER],
    hint: 'double'
  };
  params[PRICES_INDEX] = {
    value: params[PRICES_INDEX],
    hint: 'list'
  };

  cassandra.query(INSERT_BET_CQL, params, one, callback);
}
/**
 * inserts pending bets
 * @param  {uuid}   athleteId
 * @param  {string}   athleteName
 * @param  {string}   athleteTeam
 * @package {timeuuid}  betId
 * @param  {int}   expirationTimeMinutes
 * @param  {double}   fantasyValue
 * @param  {uuid}   gameId
 * uuid for game player is playing in
 * @param  {string}   sport
 * @param  {double}   wager
 * amount it costs to initially buy the bet
 * @param  {string}   username
 * get from req.user
 * @param  {boolean}  isOverBetter
 * @param  {Function} callback
 * args: err
 */
function insertPending(
  athleteId,
  athleteName,
  athleteTeam,
  betId,
  expirationTimeMinutes,
  fantasyValue,
  gameId,
  isOverBetter,
  sport,
  username,
  wager,
  callback) {

  var bettorUsernames = [DEFAULT_USERNAME, DEFAULT_USERNAME];
  var isSellingPosition = [false, false];
  var expiration = new Date(
    ((new Date()).getTime()) +
    (expirationTimeMinutes * MINUTES_IN_MILLISECONDS));
  var expirations = [0, 0];
  var payoff = 2 * wager;
  var oldPrices = [wager, wager];
  var prices = [0, 0];

  var position;
  var otherPosition;
  if (isOverBetter) {
    position = OVER;
    otherPosition = UNDER;
  }
  else {
    position = UNDER;
    otherPosition = OVER;
  }
  bettorUsernames[position] = username;
  expirations[otherPosition] = expiration;
  isSellingPosition[otherPosition] = true;
  prices[otherPosition] = wager;

  insert(
  [
    athleteId,
    athleteName,
    athleteTeam,
    betId,
    PENDING,
    bettorUsernames,
    expirations,
    fantasyValue,
    gameId,
    isSellingPosition,
    oldPrices,
    payoff,
    prices,
    sport
  ],
  callback);
}

//everything after is_selling_position is extra verification and bet history
var TAKE_PENDING_BET_CQL = multiline(function() {/*
  UPDATE
    contest_a_bets
  SET
    bet_state = ?,
    bettor_usernames[?] = ?,
    expirations[?] = 0,
    is_selling_position[?] = false,
    old_prices[?] = ?,
    prices[?] = 0
  WHERE
    bet_id = ?
  IF
    bet_state = ?
  AND
    prices[?] = ?
  AND
    is_selling_position[?] = true

  AND
    athlete_id = ?
  AND
    athlete_name = ?
  AND
    athlete_team = ?
  AND
    bettor_usernames[?] = ?
  AND
    fantasy_value = ?;
*/});
function takePending(
  athleteId,
  athleteName,
  athleteTeam,
  betId,
  fantasyValue,
  opponent,
  overNotUnder,
  username, 
  wager, 
  callback) {

  var position;
  var otherPosition;
  if (overNotUnder) {
    position = OVER;
    otherPosition = UNDER;
  }
  else {
    position = UNDER;
    otherPosition = OVER;
  }
  cassandra.query(
    TAKE_PENDING_BET_CQL,
    [
      ACTIVE,
      position,
      username,
      position,
      position,
      position,
      wager,
      position,
      betId,
      PENDING,
      position,
      wager,
      position,

      athleteId,
      athleteName,
      athleteTeam,
      otherPosition,
      opponent,
      fantasyValue
    ],
    one,
    function(err, result) {
      if (err) {
        callback(err);
      }
      else if (result[APPLIED]) {
        callback(null);
      }
      else {
        callback(new Error(APPLIED));
      }
    });
}

var RESELL_BETTER_CQL = multiline(function() {/*
  UPDATE
    contest_a_bets
  SET
    is_selling_position[?] = true,
    expirations[?] = ?,
    prices[?] = ?
  WHERE
    bet_id = ?
  IF
    bet_state = ?
  AND
    bettor_usernames[?] = ?
  AND
    is_selling_position[?] = false;
*/});

function placeResell(
  betId,
  expirationTime,
  isOverBetter,
  resellPrice,
  username,
  callback) {

  var position;
  if (isOverBetter) {
    position = OVER;
  }
  else {
    position = UNDER;
  }
  cassandra.query(
    RESELL_BETTER_CQL,
    [
      position,
      position,
      new Date((new Date()).getTime()+expirationTime * MINUTES_IN_MILLISECONDS),
      position,
      resellPrice,
      betId,
      ACTIVE,
      username,
      position
    ],
    one,
    function(err, result) {
      if (err) {
        callback(err);
      }
      else if (result[APPLIED]) {
        callback(null);
      }
      else {
        callback(new Error(APPLIED));
      }
    });
}

//everything after is_selling_position is extra verification and bet history
var TAKE_RESELL_CQL = multiline(function() {/*
  UPDATE
    contest_a_bets
  SET
    bettor_usernames[?] = ?,
    is_selling_position[?] = false,
    expirations[?] = ?,
    old_prices[?] = ?,
    prices[?] = 0
  WHERE
    bet_id = ?
  IF
    bet_state = ?
  AND
    prices[?] = ?
  AND
    is_selling_position[?] = true

  AND
    athlete_id = ?
  AND
    athlete_name = ?
  AND
    athlete_team = ?
  AND
    bettor_usernames[?] = ?
  AND
    fantasy_value = ?;
*/});

function takeResell(
  athleteId,
  athleteName,
  athleteTeam,
  betId,
  fantasyValue,
  opponent,
  overNotUnder, 
  resellPrice,
  username,  
  callback) {
  
  var position;
  var otherPosition;
  if (overNotUnder) {
    position = OVER;
    otherPosition = UNDER;
  }
  else {
    position = UNDER;
    otherPosition = OVER;
  }
  cassandra.query(
    TAKE_RESELL_CQL,
    [
      position,
      username,
      position,
      position,
      0,
      position,
      resellPrice,
      position,
      betId,
      ACTIVE,
      position,
      resellPrice,
      position,

      athleteId,
      athleteName,
      athleteTeam,
      otherPosition,
      opponent,
      fantasyValue
    ],
    one,
    callback);
}

var DELETE_PENDING_BET_CQL = multiline(function() {/*
  DELETE FROM
    contest_a_bets
  WHERE
    bet_id = ?
  IF
    bet_state = ?
  AND
    bettor_usernames[?] = ?
  AND
    bettor_usernames[?] = ?;
*/});
function deletePending(betId, username, isOverBetter, callback) {
  var position1;
  var position2;
  if (isOverBetter) {
    position1 = OVER;
    position2 = UNDER;
  }
  else {
    position1 = UNDER;
    position2 = OVER;
  }
  cassandra.query(
    DELETE_PENDING_BET_CQL,
    [
      betId,
      PENDING,
      position1,
      username,
      position2,
      DEFAULT_USERNAME
    ],
    one,
    callback);
}

var DELETE_BET_CQL = multiline(function() {/*
  DELETE FROM
    contest_a_bets
  WHERE
    bet_id = ?;
*/});
function deleteBet(betId, callback) {
  cassandra.query(DELETE_BET_CQL, [betId], one, callback);
}

var RECALL_RESELL_CQL = multiline(function() {/*
  UPDATE
    contest_A_bets
  SET
    is_selling_position[?] = false,
    expirations[?] = 0,
    prices[?] = 0
  WHERE
    bet_id = ?
  IF
    bet_state = ?
  AND
    bettor_usernames[?] = ?
  AND
    is_selling_position[?] = true
  AND
    prices[?] = ?;
*/});

function recallResell(betId, isOverBetter, price, username, callback) {
  var position;
  if (isOverBetter) {
    position = OVER;
  }
  else {
    position = UNDER;
  }
  cassandra.query(
    RECALL_RESELL_CQL,
    [
      position,
      position,
      position,
      betId,
      ACTIVE,
      position,
      username,
      position,
      position,
      price
    ],
    one,
    callback);
}

exports.insertPending = insertPending;
exports.takePending = takePending;
exports.placeResell = placeResell;
exports.takeResell = takeResell;
exports.deletePending = deletePending;
exports.deleteBet = deleteBet;
exports.recallResell = recallResell;