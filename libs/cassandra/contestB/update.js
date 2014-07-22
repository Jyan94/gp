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
var states = configs.constants.contestB.STATES;
var quorum = cql.types.consistencies.quorum;
var one = cql.types.consistencies.one;

var OPEN = states.OPEN;
var FILLED = states.FILLED;
var TO_PROCESS = states.TO_PROCESS;
var PROCESSED = states.PROCESSED;
var CANCELLED = states.CANCELLED;

/** 
 * ====================================================================
 *  INSERT QUERY
 * ====================================================================
 */
var INSERT_CONTEST_QUERY = multiline(function() {/*
  INSERT INTO daily_prophet (
    athlete_names,
    athletes,
    commission_earned,
    contest_deadline_time,
    contest_end_time,
    contest_id,
    contest_name,
    contest_start_time,
    contest_state,
    contestants,
    cooldown_minutes,
    current_entries,
    entries_allowed_per_contestant,
    entry_fee,
    games,
    isfiftyfifty,
    max_wager,
    maximum_entries,
    minimum_entries,
    payouts,
    processed_payouts_time,
    sport,
    starting_virtual_money,
    total_prize_pool
  ) VALUES (
    ?, ?, ?, ?, ?, 
    ?, ?, ?, ?, ?, 
    ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?,
    ?, ?, ?, ?
  )
  IF NOT EXISTS;
*/});

var ATHLETE_NAMES_INDEX = 0;
var ATHLETES_INDEX = 1;
var CONTESTANTS_INDEX = 9;
var GAMES_INDEX = 14;
var PAY_OUTS_INDEX = 19;
/**
 * fields that need type inference are formatted
 * initialize contest by inserting into daily_prophet
 * @param  {array}   settings
 * contains array for daily_prophet entry initialization params
 * @param  {Function} callback
 * parameters (err)
 */
exports.insert  = function(settings, callback) {
  settings[ATHLETE_NAMES_INDEX] = {
    value: settings[ATHLETE_NAMES_INDEX], 
    hint: 'list'
  };

  settings[ATHLETES_INDEX] = {
    value: settings[ATHLETES_INDEX], 
    hint: 'list'
  };

  settings[CONTESTANTS_INDEX] = {
    value: settings[CONTESTANTS_INDEX], 
    hint: 'map'
  };

  settings[GAMES_INDEX] = {
    value: settings[GAMES_INDEX], 
    hint: 'list'
  };

  var payouts = settings[PAY_OUTS_INDEX];

  for (var i = 0; i !== payouts.length; i++) {
    payouts[i] = {
      value: payouts[i],
      hint: 'double'
    };
  }
  settings[PAY_OUTS_INDEX] = {
    value: payouts, 
    hint: 'list'
  };

  cassandra.query(INSERT_CONTEST_QUERY, settings, quorum, callback);
};

/* 
 * ====================================================================
 * DELETE QUERY
 * ====================================================================
 */
var DELETE_CONTEST_QUERY = multiline(function() {/*
  DELETE 
    FROM daily_prophet 
    WHERE contest_id = ?;
*/});

exports.delete = function(contestId, callback) {
  cassandra.query(DELETE_CONTEST_QUERY, [contestId], quorum, callback);
};

/*
 * ====================================================================
 * UPDATE QUERIES FOR CONTESTS
 * ====================================================================
 */

var UPDATE_STATE_QUERY = multiline(function() {/*
  UPDATE 
    daily_prophet
  SET 
    contest_state = ?
  WHERE
    contest_id = ?;
*/});

/**
 * [updateContestState description]
 * @param  {int}   nextState 
 * 0-4, defined in constants.dailyProphet
 * @param  {timeuuid}   contestId
 * @param  {Function} callback
 * args: (err)
 */
function updateContestState(nextState, contestId, callback) {
  //need to do function(err) {callback(err)} for callback
  cassandra.query(
    UPDATE_STATE_QUERY, 
    [nextState, contestId], 
    quorum, 
    function(err) {
      callback(err);
    });
}

exports.setOpen = function(contestId, callback) {
  updateContestState(OPEN, contestId, callback);
}

exports.setFilled = function(contestId, callback) {
  updateContestState(FILLED, contestId, callback);
}

exports.setToProcess = function(contestId, callback) {
  updateContestState(TO_PROCESS, contestId, callback);
}

exports.setProcessed = function(contestId, callback) {
  updateContestState(PROCESSED, contestId, callback);
}

exports.setCancelled = function(contestId, callback) {
  updateContestState(CANCELLED, contestId, callback);
}