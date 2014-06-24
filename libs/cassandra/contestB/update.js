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
    commission,
    contest_deadline_time,
    contest_end_time,
    contest_id,
    contest_start_time,
    contest_state,
    contestants,
    current_entries,
    entries_allowed_per_contestant,
    entry_fee,
    game_type,
    last_locked,
    lock_insert_delete,
    max_wager,
    maximum_entries,
    minimum_entries
    pay_outs,
    processed_payouts_time,
    sport,
    starting_virtual_money,
    total_prize_pool
  ) VALUES (
    ?, ?, ?, ?, ?, 
    ?, ?, ?, ?, ?, 
    ?, ?, ?, ?, ?,
    ?. ?. ?, ?, ?,
    ?, ?
  );
*/});

/**
 * initialize contest by inserting into contest_count_entries and contest_B
 * @param  {array}   settings
 * contains array for contest_b entry initialization params
 * @param  {Function} callback
 * parameters (err)
 */
exports.insert  = function(settings, callback) {
  cassandra.query(INSERT_CONTEST_QUERY, settings, quorum, callback);
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
 * UPDATE QUERIES
 * ====================================================================
 */

var UPDATE_STATE_QUERY = multiline(function() {/*
  UPDATE 
    contest_B
  SET 
    contest_state = ?
  WHERE
    contestId = ?
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
  cassandra.query(UPDATE_STATE_QUERY, [nextState, contestId], quorum, callback);
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

var SET_CONTESTANT_QUERY = multiline(function() {/*
  UPDATE 
    contest_B
  SET 
    contestants['?'] = ?,
    current_entries = ?
  WHERE
    contestId = ?
*/});

/**
 * @param {string}   username
 * @param {string}   contestant 
 * JSON.stringify({
 *   instances: [{contestant instance}]
 * })
 * @param {int}   numEntries 
 * number of current entries in contest
 * @param {uuid}   contestId  
 * @param {Function} callback
 * args: (err)
 */
function setContestant(username, contestant, numEntries, contestId, callback) {
  cassandra.query(
    SET_CONTESTANT_QUERY, 
    [username, contestant, numEntries, contestId],
    quorum,
    callback);
}
exports.setContestant = setContestant;

var UPDATE_CONTESTANT_QUERY = multiline(function() {/*
  UPDATE
    contest_B
  SET
    contestants['?'] = ?
  WHERE
    contest_id = ?;
*/});

/**
 * @param {string}   username
 * @param {string}   contestant 
 * JSON.stringify({
 *   instances: [{contestant instance}]
 * })
 * @param {uuid}   contestId  
 * @param {Function} callback
 * args: (err)
 */
function updateContestant(username, contestant, contestId, callback) {
  cassandra.query(
    UPDATE_CONTESTANT_QUERY,
    [username, contestant, contestId],
    one,
    callback);
}
exports.updateContestant = updateContestant;

var DELETE_CONTESTANT_QUERY = multiline(function() {/*
  DELETE
    contestants['?']
  FROM
    contest_B
  WHERE
    contest_id = ?;
*/});

/**
 * delete contestant from contest
 * @param  {[type]}   username  [description]
 * @param  {[type]}   contestId [description]
 * @param  {Function} callback  [description]
 * @return {[type]}             [description]
 */
function deleteContestant(username, contestId, callback) {
  cassandra.query(
    DELETE_CONTESTANT_QUERY,
    [username, contestId],
    one,
    callback);
}
exports.deleteContestant = deleteContestant;