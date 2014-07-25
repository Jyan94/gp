/**
 * ====================================================================
 * Author: Harrison Zhao
 * ====================================================================
 */
//TODO: convert over resell queries too
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
var MINUTE_IN_MILLISECONDS = constants.globals.MINUTE_IN_MILLISECONDS;
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

var BETTOR_USERNAMES_INDEX = 5;
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
  params[BETTOR_USERNAMES_INDEX] = {
    value: params[BETTOR_USERNAMES_INDEX],
    hint: 'map'
  };
  params[EXPIRATIONS_INDEX] = {
    value: params[EXPIRATIONS_INDEX],
    hint: 'map'
  };
  params[FANTASY_VALUE_INDEX] = {
    value: params[FANTASY_VALUE_INDEX],
    hint: 'double'
  };
  params[IS_SELLING_POSITION_INDEX] = {
    value: params[IS_SELLING_POSITION_INDEX],
    hint: 'map'
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
    hint: 'map'
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
    hint: 'map'
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

  var bettorUsernames = {};
  bettorUsernames[OVER] = DEFAULT_USERNAME;
  bettorUsernames[UNDER] = DEFAULT_USERNAME;
  var isSellingPosition = {};
  isSellingPosition[OVER] = false;
  isSellingPosition[UNDER] = false;
  var expiration = new Date(
    ((new Date()).getTime()) +
    (expirationTimeMinutes * MINUTE_IN_MILLISECONDS));
  var expirations = {};
  expirations[OVER] = new Date(0);
  expirations[UNDER] = new Date(0);
  var payoff = 2 * wager;
  var oldPrices = {};
  oldPrices[OVER] = 0;
  oldPrices[UNDER] = 0;
  var prices = {};
  prices[OVER] = 0;
  prices[UNDER] = 0;

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
  function(err) {
    callback(err);
  });
}

//everything after is_selling_position is extra verification and bet history
//doesn't work using this query, manually construct the query instead
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
  var query =
    'UPDATE contest_A_bets ' +
    'SET bet_state = ?, ' +
    'bettor_usernames[\'' + position + '\'] = \'' + username + '\', ' +
    'expirations[\'' + position + '\'] = 0, ' +
    'is_selling_position[\'' + position + '\'] = false, ' +
    'old_prices[\'' + position + '\'] = ?, ' +
    'prices[\'' + position + '\'] = 0 ' +
    'WHERE bet_id = ? ' +
    'IF bet_state = ? AND ' +
    'prices[\'' + position + '\'] = ? AND ' +
    'is_selling_position[\'' + position + '\'] = true AND ' +
    'athlete_id = ? AND ' +
    'athlete_name = ? AND ' +
    'athlete_team = ? AND ' +
    'bettor_usernames[\'' + otherPosition + '\'] = \'' + opponent + '\' AND ' +
    'fantasy_value = ?;';
  cassandra.queryOneRow(
    query,
    [
      ACTIVE,
      {value: wager, hint: 'double'},
      betId,
      PENDING,
      {value: wager, hint: 'double'},
      athleteId,
      athleteName,
      athleteTeam,
      {value: fantasyValue, hint: 'double'}
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
  var query =
    'UPDATE contest_a_bets ' +
    'SET is_selling_position[\'' + position +'\'] = true, ' +
    'expirations[\'' + position +'\'] = ?, ' +
    'prices[\'' + position +'\'] = ? ' +
    'WHERE bet_id = ? ' +
    'IF bet_state = ? AND ' +
    'bettor_usernames[\'' + position +'\'] = '  + username + ' AND ' +
    'is_selling_position[\'' + position +'\'] = false;';
  cassandra.queryOneRow(
    RESELL_BETTER_CQL,
    [
      position,
      position,
      new Date((new Date()).getTime()+expirationTime * MINUTE_IN_MILLISECONDS),
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
  var query =
    'Update'
  cassandra.queryOneRow(
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

//delete pending query does not work at the moment, manually construct query
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
    bettor_usernames[?] = ?
  AND
    prices[?] = ?;
*/});
function deletePending(betId, isOverBetter, username, wager, callback) {
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
  var query =     
    'DELETE FROM contest_a_bets ' +
    'WHERE bet_id = ?' +
    ' IF bet_state = ? AND ' +
    ' bettor_usernames[\'' +  position1 + '\'] = \'' + username + '\' AND' +
    ' bettor_usernames[\'' +  position2 + '\'] = \'' + DEFAULT_USERNAME + 
    '\' AND' +
    ' prices[\'' +  position2 + '\'] = ' + wager + ';'
  cassandra.queryOneRow(
    query,
    [betId, PENDING],
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

exports.insertPending = insertPending;
exports.takePending = takePending;
exports.placeResell = placeResell;
exports.takeResell = takeResell;
exports.deletePending = deletePending;
exports.deleteBet = deleteBet;
exports.recallResell = recallResell;