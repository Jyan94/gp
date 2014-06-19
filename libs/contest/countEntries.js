'use strict';
(require('rootpath')());

var multiline = require('multiline');
var cql = require('')
var cassandra = require('libs/cassandra/cql');
var async = require('async');

exports.INSERT_CONTEST_QUERY = multiline(function(){/*
  INSERT INTO contest_B (
    contest_id,
    maximum_entries,
    minimum_entries
  ) VALUES (
    ?, ?, ?
  );
*/});

exports.INCREMENT_CONTESTANTS_QUERY = multiline(function(){/*
  UPDATE 
    contest_count_entries
  SET
    current_entries = current_entries + 1
  WHERE
    contest_id = ?
  IF
    current_entries < maximum_entries;
*/});

exports.DECREASE_CONTESTANTS_QUERY = multiline(function(){/*
  UPDATE
    contest_count_entries
  SET
    current_entries = current_entries - 1
  WHERE
    contest_id = ?;
*/});

exports.DELETE_CONTEST_QUERY = multiline(function(){/*
  DELETE
    FROM contest_count_entries
    WHERE contest_id = ?;
*/});

var SELECT_CONTEST_QUERY = multiline(function(){/*
  SELECT *
    FROM contest_count_entries
    WHERE contest_id = ?;
*/});

exports.select = function(contestId, callback) {
  cassandra.query(
    SELECT_CONTEST_QUERY, 
    [contestId], 
    cql.types.consistency.quorum, 
    callback);
}

exports.selectFromContestsArray = function(contests, retCallback) {
  async.map(
    contests, 
    function(contest, callback) {
      exports.select(contest.contest_id, function(err, result) {
        if (err) {
          callback(err);
        }
        callback(null, result);
      });
    },
    function(err, result) {
      retCallback(err, result);
    });
}