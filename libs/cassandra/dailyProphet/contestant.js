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
var states = configs.constants.dailyProphet;
var quorum = cql.types.consistencies.quorum;
var one = cql.types.consistencies.one;

var APPLIED = configs.constants.dailyProphet.APPLIED;
var SEMICOLON = ';';

/*
 * ====================================================================
 * UPDATE QUERIES FOR CONTESTANTS
 * ====================================================================
 */
var SET_CONTESTANT_QUERY_1 = multiline(function() {/*
  UPDATE 
    daily_prophet
  SET 
    contestants['
*/});

//spaces matter
var SET_CONTESTANT_QUERY_2 = multiline(function() {/*
'] = ?,
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
  var SET_CONTESTANT_QUERY = SET_CONTESTANT_QUERY_1;
  SET_CONTESTANT_QUERY += username;
  SET_CONTESTANT_QUERY += SET_CONTESTANT_QUERY_2;
  cassandra.queryOneRow(
    SET_CONTESTANT_QUERY, 
    [contestant, newNumEntries, contestId, oldNumEntries],
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


var UPDATE_CONTESTANT_QUERY_1 = multiline(function() {/*
  UPDATE
    daily_prophet
  SET
    contestants['
*/});

var UPDATE_CONTESTANT_QUERY_2 = multiline(function() {/*
'] = ?
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
  if(username.indexOf(SEMICOLON) === -1) {
    var UPDATE_CONTESTANT_QUERY = UPDATE_CONTESTANT_QUERY_1;
    UPDATE_CONTESTANT_QUERY += username;
    UPDATE_CONTESTANT_QUERY += UPDATE_CONTESTANT_QUERY_2;
    cassandra.query(
      UPDATE_CONTESTANT_QUERY,
      [contestant, contestId],
      one,
      callback);
  }
  else {
    callback(new Error('username contains semicolon'));
  }
}
exports.updateContestant = updateContestant;

var DELETE_CONTESTANT_QUERY_1 = multiline(function() {/*
  DELETE
    contestants['
*/});

var DELETE_CONTESTANT_QUERY_2 = multiline(function() {/*
']
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
  if(username.indexOf(SEMICOLON) === -1) {
    var DELETE_CONTESTANT_QUERY = DELETE_CONTESTANT_QUERY_1;
    DELETE_CONTESTANT_QUERY += username;
    DELETE_CONTESTANT_QUERY += DELETE_CONTESTANT_QUERY_2;
    cassandra.query(
      DELETE_CONTESTANT_QUERY,
      [contestId],
      one,
      callback);
  }
  else {
    callback(new Error('username contains semicolon'));
  }
}
exports.deleteUsernameFromContest = deleteUsernameFromContest;