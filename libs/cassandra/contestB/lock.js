/**
 * ====================================================================
 * Author: Harrison Zhao
 * ====================================================================
 */
'use strict';
(require('rootpath')());

var cassandra = require('libs/cassandra/cql');
var cql = require('config/index.js').cassandra.cql;
var constants = require('config/constants').contestB;
var multiline = require('multiline');
var async = require('async');
var TimeSeries = require('timeseriesValues');
var User = require('libs/cassandra/user');
var quorum = cql.types.consistencies.quorum;
var one = cql.types.consistencies.one;

var MAX_MILLISECONDS = constants.MAX_MILLISECONDS;
var MAX_TRIES = constants.MAX_TRIES;
var MAX_WAIT = constants.MAX_WAIT;
var ZERO_TRIES = 0;
var APPLIED = '[applied]';

var OBTAIN_LOCK_QUERY = multiline(function() {/*
  UPDATE
    contest_B
  SET
    last_locked = now(),
    lock_current_entries = true
  WHERE
    contest_id = ?
  IF
    lock_current_entries = false;
*/});

var READ_LAST_LOCKED_QUERY = multiline(function(){/*
  SELECT
    last_locked
  FROM
    contest_B
  WHERE
    contest_id = ?;
*/});

var OVERRIDE_LOCK_QUERY = multiline(function() {/*
  UPDATE
    contest_B
  SET
    lock_current_entries = true;
  WHERE
    contest_id = ?
*/});

var RELEASE_LOCK_QUERY = multiline(function() {/*
  UPDATE
    contest_B
  SET
    lock_current_entries = false
  WHERE
    contest_id = ?
*/});

/**
 * tries to override a lock if locked for too long (could happen)
 * @param  {object}   user       
 * object from req.user
 * @param  {uuid}   contestId
 * @param  {int}   tries     
 * number of attempts to obtain lock
 * @param  {Function}   obtainLock
 * obtainLock function
 * @param  {Function} callback   
 * args: (err)
 */
function tryOverrideLock(user, contestId, tries, obtainLock, callback) {

  cassandra.queryOneRow(
    READ_LAST_LOCKED_QUERY, 
    [contestId], 
    quorum, 
    function(err, result) {
      var lastLockedPlusTime = 
        new Date(result.last_locked.getTime() + MAX_MILLISECONDS);
      if (err) {
        callback(err);
      }
      else if (+(new Date()) < +lastLockedPlusTime) {
        cassandra.query(OVERRIDE_LOCK_QUERY, [contestId], quorum, callback);
      }
      else {
        obtainLock(user, contestId, tries + 1, callback);
      }
    });

}

/**
 * obtains a lock of reading and writing to inserting and deleting contestants
 * @param  {object}   user      
 * req.user object
 * @param  {uuid}   contestId 
 * @param  {int}   tries     
 * number of attempts to obtain lock, starts at 0
 * @param  {Function} callback  
 * args: (err)
 */
function obtainLock(user, contestId, tries, callback) {
  cassandra.queryOneRow(
    OBTAIN_LOCK_QUERY, 
    [contestId], 
    quorum, 
    function(err, result){
      if (err) {
        callback(err);
      }
      else if (result[APPLIED]) {
        callback(null);
      }
      else if (tries > MAX_TRIES) {
        tryOverrideLock(user, contestId, tries, obtainLock, callback);
      }
      else {
        var random = Math.round(Math.random() * MAX_WAIT);
        obtainLock(user, contestId, tries + 1, callback);
      }
  });
}

/**
 * starts obtainLock with tries = 0
 * @param  {object}   user      
 * req.user object
 * @param  {uuid}   contestId 
 * @param  {int}   tries     
 * number of attempts to obtain lock, starts at 0
 * @param  {Function} callback
 * args: (err)  
 */
function tryObtainLock(user, contestId, callback) {
  obtainLock(user, contestId, ZERO_TRIES, callback);
}

/**
 * releases lock, called after exited critical region
 * @param  {uuid}   contestId
 * @param  {Function} callback  
 * args: (err)
 */
function releaseLock(contestId, callback) {
  cassandra.query(RELEASE_LOCK_QUERY, [contestId], quorum, callback);
}

/**
 * ====================================================================
 * Used exports
 * ====================================================================
 */
exports.tryObtainLock = tryObtainLock;
exports.tryOverrideLock = tryOverrideLock;
exports.releaseLock = releaseLock;