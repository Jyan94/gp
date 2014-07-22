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
var quorum = cql.types.consistencies.quorum;
var one = cql.types.consistencies.one;

var states = configs.constants.contestB.STATES;
var OPEN = states.OPEN;
var APPLIED = configs.constants.cassandra.APPLIED;
var SEMICOLON = configs.constants.globals.SEMICOLON;

/*
 * ====================================================================
 * UPDATE QUERIES FOR CONTESTANTS
 * ====================================================================
 */
var SET_CONTESTANT_QUERY = multiline(function() {/*
  UPDATE 
    daily_prophet
  SET 
    contestants[?] = ?,
    current_entries = ?
  WHERE
    contest_id = ?
  IF
    current_entries = ?;
*/});

/**
 * final check on concurrency
 * the IF is for the rare case that two servers may possibly obtain a lock at
 * this is possible if a server with the lock goes down and then two servers
 * read the contest and override the lock at the same time
 * at this point, both servers believe that they have the lock
 * 
 * @param {string}   username
 * @param {string}   contestant 
 * @param {int}   newNumEntries 
 * number of current entries in contest, accounting for changes
 * @param {int}   oldNumEntries 
 * number of current entries in contest, before changes
 * @param {timeuuid}   contestId  
 * @param {Function} callback
 * args: (err)
 */
function setContestant(
  username, 
  contestant, 
  newNumEntries, 
  oldNumEntries, 
  contestId, 
  callback) {
  cassandra.queryOneRow(
    SET_CONTESTANT_QUERY, 
    [username, contestant, newNumEntries, contestId, oldNumEntries],
    quorum,
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

/**
 * @param {string}   username
 * @param {string}   contestant 
 * @param {int}   numEntries 
 * number of current entries in contest, accounting for changes
 * @param {timeuuid}   contestId  
 * @param {Function} callback
 * args: (err)
 */
function addContestant(username, contestant, currEntries, contestId, callback) {
  setContestant(
    username, 
    contestant, 
    currEntries, 
    currEntries - 1,
    contestId,
    callback);
}
exports.addContestant = addContestant;

/**
 * same as above except remove so number of entries is decreasing
 * @param {string}   username
 * @param {string}   contestant 
 * @param {int}   numEntries 
 * number of current entries in contest, accounting for changes
 * @param {timeuuid}   contestId  
 * @param {Function} callback
 * args: (err)
 */
function removeContestant(username,contestant,currEntries,contestId,callback) {
  setContestant(
    username, 
    contestant, 
    currEntries, 
    currEntries + 1,
    contestId,
    callback);
}
exports.removeContestant = removeContestant;


var UPDATE_CONTESTANT_QUERY = multiline(function() {/*
  UPDATE
    daily_prophet
  SET
    contestants[?] = ?
  WHERE
    contest_id = ?;
*/});

/**
 * @param {string}   username
 * @param {string}   contestant 
 * JSON.stringify({
 *   instances: [{contestant instance}]
 * })
 * @param {timeuuid}   contestId  
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
    contestants[?]
  FROM
    daily_prophet
  WHERE
    contest_id = ?;
*/});

/**
 * delete contestant from contest
 * @param  {string}   username 
 * @param  {timeuuid}   contestId
 * @param  {Function} callback
 * args: (err)
 */
function deleteUsernameFromContest(username, contestId, callback) {
  cassandra.query(
    DELETE_CONTESTANT_QUERY,
    [username, contestId],
    one,
    callback);
}
exports.deleteUsernameFromContest = deleteUsernameFromContest;
