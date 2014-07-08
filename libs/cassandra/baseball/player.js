'use strict';
require('rootpath')();

var cassandra = require('libs/cassandra/cql');
var cql = require('config/index.js').cassandra.cql;
var multiline = require('multiline');
var one = cql.types.consistencies.one;

var CURRENT_VALUE_INDEX = 1;
var STATISTICS_INDEX = 15;
var CURRENT_VALUE_KEY = 'current_value';
var STATISTICS_KEY = 'statistics';

//16 fields
var INSERT_PLAYER_CQL = multiline(function() {/*
  INSERT INTO baseball_player (
    player_id,
    current_value,
    full_name,
    first_name,
    last_name,
    short_team_name,
    long_team_name,
    status,
    position,
    profile_url,
    uniform_number,
    height,
    weight,
    age,
    image,
    statistics
  ) VALUES
    (?, ?, ?, ?, ?, 
     ?, ?, ?, ?, ?, 
     ?, ?, ?, ?, ?, 
     ?);
*/});

/**
 * @param  {array}   fields
 * @param  {Function} callback
 * args: (err)
 */
exports.insert = function (fields, callback) {
  fields[CURRENT_VALUE_INDEX] = {
    value: fields[CURRENT_VALUE_INDEX],
    hint: 'double'
  };
  fields[STATISTICS_INDEX] = {
    value: fields[STATISTICS_INDEX],
    hint: 'list'
  };
  cassandra.query(INSERT_PLAYER_CQL, fields, one, callback);
};

var DELETE_PLAYER_CQL = multiline(function() {/*
  DELETE FROM baseball_player WHERE player_id = ?;
*/});
exports.delete = function (playerId, callback) {
  cassandra.query(DELETE_PLAYER_CQL, [playerId], one, callback);
};

var UPDATE_PLAYER_CQL_1 = multiline(function() {/*
  UPDATE baseball_player SET 
*/});
var UPDATE_PLAYER_CQL_2 = multiline(function() {/*
  WHERE
    player_id = ?;
*/});
/**
 * @param  {uuid}   playerId
 * @param  {object}   fields
 * keys are fields
 * values corresponding to keys are update values
 * @param  {Function} callback
 * args: (err)
 */
exports.update = function (playerId, fields, callback) {
  var fieldNames = [];
  var fieldValues = [];
  for (var key in fields) {
    if (fields.hasOwnProperty(key)) {
      fieldNames.push(key);
      switch (key) {
        case CURRENT_VALUE_KEY:
          fieldValues.push({value: fields[key], hint: 'double'});
          break;
        case STATISTICS_KEY:
          fieldValues.push({value: fields[key], hint: 'list'});
          break;
        default:
          fieldValues.push(fields[key]);
          break;
      }
    }
  }
  var query = UPDATE_PLAYER_CQL_1;
  for (var i = 0; i < fieldNames.length; i++) {
    query += (fieldNames[i] + ' = ?');
    if (i < (fieldNames.length - 1)) {
      query += ', ';
    }
  }
  query += (' ' + UPDATE_PLAYER_CQL_2);
  fieldValues.push(playerId);
  cassandra.query(query, fieldValues, one, callback);
};

var SELECT_PLAYER_CQL = multiline(function () {/*
  SELECT * FROM baseball_player WHERE player_id = ?;
*/});
/**
 * @param  {uuid}   playerId
 * @param  {Function} callback
 * args: (err, result)
 * result is a player object
 */
exports.select = function (playerId, callback) {
  cassandra.queryOneRow(SELECT_PLAYER_CQL, [playerId], one, callback);
};

var SELECT_PLAYERS_USING_TEAM_CQL = multiline(function () {/*
  SELECT * FROM baseball_player WHERE team = ?;
*/});
//not good
exports.selectUsingTeam = function (team, callback) {
  cassandra.query(SELECT_PLAYERS_USING_TEAM_CQL, [team], one, callback);
}

var SELECT_PLAYER_IMAGES_USING_PLAYERNAME = multiline(function() {/*
  SELECT * FROM player_images WHERE player_name = ?;
*/});
/**
 * selects 
 * @param  {[type]}   playerName [description]
 * @param  {Function} callback   [description]
 * @return {[type]}              [description]
 */
exports.selectImagesUsingPlayerName = function(playerName, callback) {
  cassandra.query(
    SELECT_PLAYER_IMAGES_USING_PLAYERNAME, 
    [playerName], 
    one,
    callback);
}

var AUTOCOMPLETE_QUERY = multiline(function() {/*
  SELECT player_id, full_name FROM baseball_player
*/});
/**
 * selects all player names and ids
 * @param  {Function} callback
 * args: (err, result)
 */
exports.selectAllPlayerNames = function(callback) {
  cassandra.query(AUTOCOMPLETE_QUERY, [], one, callback);
}

var ADD_STATISTICS_QUERY = multiline(function() {/*
  UPDATE baseball_player SET statistics = statistics + ? WHERE player_id = ?
*/});
/**
 * adds a single statistic to the player
 * @param {uuid}   playerId
 * @param {string}   statistic
 * stringified statistic
 * @param {Function} callback
 * args: (err)
 */
exports.addStatistic = function (playerId, statistic, callback) {
  cassandra.query(ADD_STATISTICS_QUERY, [[statistic], playerId], one, callback);
}

var DELETE_SPECIFIC_STATISTICS_QUERY_1 = multiline(function() {/*
  DELETE statistics[
*/});
var DELETE_SPECIFIC_STATISTICS_QUERY_2 = multiline(function() {/*
] FROM baseball_player WHERE player_id = ? 
*/});
/**
 * @param  {uuid}   playerId
 * @param  {int}   statisticsIndex
 * @param  {Function} callback
 * args: (err)
 */
exports.deleteStatistics = function (playerId, statisticsIndex, callback) {
  var query = 
    DELETE_SPECIFIC_STATISTICS_QUERY_1 + 
    statisticsIndex + 
    DELETE_SPECIFIC_STATISTICS_QUERY_2;
  cassandra.query(query, [playerId], one, callback);
}