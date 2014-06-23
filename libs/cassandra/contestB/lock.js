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
var async = require('async');
var TimeSeries = require('timeseriesValues');
var User = require('libs/cassandra/user');
var quorum = cql.types.consistencies.quorum;
var one = cql.types.consistencies.one;

var MAX_MILLISECONDS = 30000;
var MAX_TRIES = 30;
var MAX_WAIT = 1000;
var ZERO_TRIES = 0;

var OBTAIN_LOCK_QUERY = multiline(function() {/*
  UPDATE
    contest_B
  SET
    last_locked = now(),
    lock_insert_delete = true
  WHERE
    contest_id = ?
  IF
    lock_insert_delete = false;
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
    lock_insert_delete = true;
  WHERE
    contest_id = ?
*/});

var RELEASE_LOCK_QUERY = multiline(function() {/*
  UPDATE
    contest_B
  SET
    lock_insert_delete = false
  WHERE
    contest_id = ?
*/});

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

function obtainLock(user, contestId, tries, callback) {
  cassandra.queryOneRow(
    OBTAIN_LOCK_QUERY, 
    [contestId], 
    quorum, 
    function(err, result){
      if (err) {
        callback(err);
      }
      else if (result['[applied]']) {
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

function tryObtainLock(user, contestId, callback) {
  obtainLock(user, contestId, ZERO_TRIES, callback);
}

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