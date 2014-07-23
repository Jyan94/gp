/**
 * ====================================================================
 * Author: Harrison Zhao
 * ====================================================================
 */
'use strict';
require('rootpath')();

var cassandra = require('libs/cassandra/cql');
var cql = require('config/index.js').cassandra.cql;
var multiline = require('multiline');
var one = cql.types.consistencies.one;

var INSERT_GAME_CQL = multiline(function() {/*
  INSERT INTO baseball_game (
    athletes,
    away_score,
    end_time,
    game_id,
    game_date,
    home_score,
    long_away_name,
    long_home_name,
    play_by_play,
    short_away_name,
    short_home_name,
    start_time,
    status
  ) VALUES (
    ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?,
    ?, ?, ?);
*/});
var ATHLETES_INDEX = 0;
var PLAY_BY_PLAY_INDEX = 8;
/**
 * inserts game into database
 * @param  {array}   fields
 * array of fields to insert into baseball_game
 * @param  {Function} callback
 * args: (err)
 */
exports.insert = function(fields, callback) {
  fields[ATHLETES_INDEX] = {
    value: fields[ATHLETES_INDEX],
    hint: 'list'
  };
  fields[PLAY_BY_PLAY_INDEX] = {
    value: fields[PLAY_BY_PLAY_INDEX],
    hint: 'list'
  };
  cassandra.query(INSERT_GAME_CQL, fields, one, callback);
};

var SELECT_GAME_CQL = multiline(function() {/*
  SELECT * FROM baseball_game WHERE game_id = ?;
*/});

/**
 * selects a given game
 * @param  {timeuuid}   gameId
 * @param  {Function} callback
 * args: (err, result)
 */
exports.select = function(gameId, callback) {
  cassandra.queryOneRow(SELECT_GAME_CQL, [gameId], one, callback);
};

var UPDATE_GAME_CQL_1 = multiline(function() {/*
  UPDATE baseball_game SET
*/});
var UPDATE_GAME_CQL_2 = multiline(function() {/*
  WHERE
    game_id = ?;
*/});
/**
 * updates game with given id
 * @param  {object}   fields
 * keys are fields to update
 * values are values corresponding to fields
 * @param  {timeuuid}   gameId
 * @param  {Function} callback
 * args: (err)
 */
exports.update = function(fields, gameId, callback) {
  var fieldNames = [];
  var fieldValues = [];
  for (var key in fields) {
    if (fields.hasOwnProperty(key)) {
      fieldNames.push(key);
      fieldValues.push(fields[key]);
    }
  }
  var query = UPDATE_GAME_CQL_1;
  for (var i = 0; i < fieldNames.length; i++) {
    query += (fieldNames[i] + ' = ?');
    if (i < (fieldNames.length - 1)) {
      query += ', ';
    }
  }
  query += (' ' + UPDATE_GAME_CQL_2);
  fieldValues.push(gameId);
  cassandra.query(query, fieldValues, one, callback);
};

var SELECT_TODAYS_GAME_CQL = multiline(function() {/*
  SELECT *
  FROM baseball_game
  WHERE game_date = ?;
*/});
exports.selectTodaysGames = function(callback) {
  var today = new Date();
  var date = ('0' + (today.getDate())).slice(-2);
  var month = ('0' + (today.getMonth() + 1)).slice(-2);
  var year = today.getFullYear();
  today = year + '/' + month + '/' + date;
  cassandra.query(SELECT_TODAYS_GAME_CQL, [today], one, callback);
};