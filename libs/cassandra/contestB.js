/**
 * ====================================================================
 * Author: Harrison Zhao
 * ====================================================================
 */
'use strict';
(require('rootpath')());

var cassandra = require('libs/cassandra/cql');
var cql = require('config/index.js').cassandra.cql;
var multiline = require('multiline');

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
    entry_fee,
    game_type,
    maximum_entries,
    minimum_entries,
    pay_outs,
    processed_payouts_time,
    sport,
    starting_virtual_money,
    total_prize_pool
  ) VALUES
    (?, ?, ?, ?, ?, 
     ?, ?, ?, ?, ?, 
     ?, ?, ?, ?, ?,
     ?, ?, ?);
*/});

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

/*
 * ====================================================================
 * SELECT QUERIES
 * ====================================================================
 */
var SELECT_CONTEST_ID_QUERY = multiline(function() {/*
  SELECT * 
    FROM contest_B 
    WHERE contest_id = ?;
*/});

var SELECT_USERNAME_QUERY = multiline(function() {/*
  SELECT * 
    FROM contest_B 
    WHERE contestants CONTAINS KEY ?;
*/});

var SELECT_CANCELLED_QUERY = multiline(function(){/*
  SELECT *
    FROM contest_B
    WHERE sport = ? AND open = false AND cancelled = true;
*/});

var SELECT_OPEN_QUERY = multiline(function(){/*
  SELECT *
    FROM contest_B
    WHERE sport = ? AND open = true;
*/});

var SELECT_CONTESTS_TO_PROCESS_QUERY = multiline(function(){/*
  SELECT *
    FROM contest_B
    WHERE sport = ? 
    AND open = true 
    AND cancelled = false 
    AND processed_payouts = false;
*/});

var ADD_CONTESTANT_QUERY = multiline(function(){/*
  UPDATE 
    contest_B
  SET 
    contestants['?'].instances = contestant['?'].instances + ?
  WHERE
    contestId = ?
  IF
    current_entries < maximum_entries;
*/});

var NEW_CONTESTANT_INSTANCE = {
  virtual_money_remaining : 0,
  bets : {}
}

/**
 * batch query
 * query1: update set 
 */

/**
 * takes an array of fields to insert, must be in order of the query
 * @param  {array}   fields   [insert array fields]
 * @param  {Function} callback [description]
 * @return {null}            calls callback instead
 */
exports.insert = function(fields, callback) {

}

exports.delete = function(contestId, callback) {

}

exports.selectById = function(contestId, callback) {

}

exports.selectByUsername = function(username, callback) {

}

exports.selectCancelled = function(sport, callback) {

}

exports.selectOpenContests = function(sport) {

}

exports.selectContestsToProcessPayouts = function() {

}

/**
 * first checks if tournament is full
 * checks if username is already in contest and if it is, appends another
 * newly initialized contestant instance
 * performs a post check after adding user to make sure the contest 
 * is not over capacity
 * @param {[type]}   username  [description]
 * @param {[type]}   contestId [description]
 * @param {Function} callback  [description]
 */
exports.addContestant = function(username, contestId, callback) {

}

exports.removeContestant = function(
  contestantInstanceId, 
  username, 
  contestId,
  callback) {

}

exports.updateContestant = function(
  contestantInstanceObject,
  contestantInstanceIndex,
  username,
  contestId,
  callback) {

}