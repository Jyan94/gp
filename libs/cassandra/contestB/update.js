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

/** 
 * ====================================================================
 *  INSERT QUERY
 * ====================================================================
 */
var INSERT_CONTEST_QUERY = multiline(function() {/*
  INSERT INTO contest_B (
    athletes,
    commission_earned,
    contest_deadline_time,
    contest_end_time,
    contest_id,
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
    pay_outs,
    processed_payouts_time,
    sport,
    starting_virtual_money,
    total_prize_pool
  ) VALUES (
    ?, ?, ?, ?, ?, 
    ?, ?, ?, ?, ?, 
    ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?,
    ?, ?
  );
*/});

var ATHLETES_INDEX = 0;
var CONTESTANTS_INDEX = 7
var GAMES_INDEX = 12;
var PAY_OUTS_INDEX = 17;
/**
 * fields that need type inference are formatted
 * initialize contest by inserting into contest_count_entries and contest_B
 * @param  {array}   settings
 * contains array for contest_b entry initialization params
 * @param  {Function} callback
 * parameters (err)
 */
exports.insert  = function(settings, callback) {
  settings[ATHLETES_INDEX] = {
    value: settings[ATHLETES_INDEX], 
    hint: 'map'
  };
  settings[CONTESTANTS_INDEX] = {
    value: settings[CONTESTANTS_INDEX], 
    hint: 'map'
  };
  settings[GAMES_INDEX] = {
    value: settings[GAMES_INDEX], 
    hint: 'list'
  };
  for (var key in settings[PAY_OUTS_INDEX]) {
    if (settings[PAY_OUTS_INDEX].hasOwnProperty(key)) {
      settings[PAY_OUTS_INDEX][key] = {
        value: settings[PAY_OUTS_INDEX][key],
        hint: 'double'
      };
    }
  }
  settings[PAY_OUTS_INDEX] = {
    value: settings[PAY_OUTS_INDEX], 
    hint: 'map'
  };
  cassandra.query(INSERT_CONTEST_QUERY, settings, quorum, function(err) {
    callback(err);
  });
};

/* 
 * ====================================================================
 * DELETE QUERY
 * ====================================================================
 */
var DELETE_CONTEST_QUERY = multiline(function() {/*
  DELETE 
    FROM contest_B 
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
    contest_B
  SET 
    contest_state = ?
  WHERE
    contest_id = ?;
*/});

/**
 * [updateContestState description]
 * @param  {int}   nextState 
 * 0-4, defined in constants.contestB
 * @param  {uuid}   contestId
 * @param  {Function} callback
 * args: (err)
 */
function updateContestState(nextState, contestId, callback) {
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