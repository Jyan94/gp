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
    away_score,
    away_team,
    end_time,
    game_id,
    home_score,
    home_team,
    players,
    play_by_play,
    season_type,
    start_time,
    status
  ) VALUES (
    ?, ?, ?, ?, ?, 
    ?, ?, ?, ?, ?,
    ?);
*/});

var PLAYERS_INDEX = 6;
var PLAY_BY_PLAY_INDEX = 7;

/**
 * inserts game into database
 * @param  {array}   fields
 * array of fields to insert into baseball_game
 * @param  {Function} callback
 * args: (err)
 */
exports.insert = function(fields, callback) {
  fields[PLAYERS_INDEX] = {
    value: fields[PLAYERS_INDEX],
    hint: 'list'
  };
  fields[PLAY_BY_PLAY_INDEX] = {
    value: fields[PLAY_BY_PLAY_INDEX],
    hint: 'list'
  };
  console.log(fields);
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
  cassandra.query(query, fieldValues, one, callback);
}

var SELECT_TODAY_GAME_CQL = multiline(function() {/*
  SELECT * FROM baseball_game WHERE time > ? AND time < ?
*/});
exports.selectTodayGames = function(callback) {
  var now = new Date();
  var todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
}
