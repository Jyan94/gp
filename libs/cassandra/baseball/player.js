'use strict';
require('rootpath')();

var cassandra = require('libs/cassandra/cql');
var cql = require('config/index.js').cassandra.cql;
var multiline = require('multiline');
var one = cql.types.consistencies.one;

var STATISTICS_INDEX = 10;
var CURRENT_VALUE_KEY = 'current_value';
var STATISTICS_KEY = 'statistics';

//16 fields
var INSERT_PLAYER_CQL = multiline(function() {/*
  INSERT INTO baseball_player (
    age,
    athlete_id,
    first_name,
    full_name,
    height,
    image_url,
    last_name,
    long_team_name,
    position,
    short_team_name,
    statistics,
    status,
    team_id,
    uniform_number,
    weight
  ) VALUES
    (?, ?, ?, ?, ?,
     ?, ?, ?, ?, ?,
     ?, ?, ?, ?, ?);
*/});

/**
 * @param  {array}   fields
 * @param  {Function} callback
 * args: (err)
 */
exports.insert = function (fields, callback) {
  fields[STATISTICS_INDEX] = {
    value: fields[STATISTICS_INDEX],
    hint: 'map'
  };
  cassandra.query(INSERT_PLAYER_CQL, fields, one, callback);
};

var DELETE_PLAYER_CQL = multiline(function() {/*
  DELETE FROM baseball_player WHERE athlete_id = ?;
*/});
exports.delete = function (athleteId, callback) {
  cassandra.query(DELETE_PLAYER_CQL, [athleteId], one, callback);
};

var UPDATE_PLAYER_CQL_1 = multiline(function() {/*
  UPDATE baseball_player SET
*/});
var UPDATE_PLAYER_CQL_2 = multiline(function() {/*
  WHERE
    athlete_id = ?;
*/});
/**
 * @param  {uuid}   athleteId
 * @param  {object}   fields
 * keys are fields
 * values corresponding to keys are update values
 * @param  {Function} callback
 * args: (err)
 */
exports.update = function (athleteId, fields, callback) {
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
          fieldValues.push({value: fields[key], hint: 'map'});
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
  fieldValues.push(athleteId);
  cassandra.query(query, fieldValues, one, callback);
};

var SELECT_PLAYER_CQL = multiline(function () {/*
  SELECT * FROM baseball_player WHERE athlete_id = ?;
*/});
/**
 * @param  {uuid}   athleteId
 * @param  {Function} callback
 * args: (err, result)
 * result is a player object
 */
exports.select = function (athleteId, callback) {
  cassandra.queryOneRow(SELECT_PLAYER_CQL, [athleteId], one, callback);
};


var SELECT_PLAYERS_USING_LONG_TEAM_CQL = multiline(function () {/*
  SELECT * FROM baseball_player WHERE long_team_name = ?;
*/});
/**
 * @param  {string} team
 * long team name (full team name)
 * @param  {Function} callback
 * args: (err, results)
 * results is an array of players
 */
exports.selectUsingLongTeamName = function (team, callback) {
  cassandra.query(SELECT_PLAYERS_USING_LONG_TEAM_CQL, [team], one, callback);
};

var SELECT_PLAYERS_USING_SHORT_TEAM_CQL = multiline(function () {/*
  SELECT * FROM baseball_player WHERE short_team_name = ?;
*/});
/**
 * @param  {string} team
 * short team name (three letters)
 * @param  {Function} callback
 * args: (err, results)
 * results is an array of players
 */
exports.selectUsingShortTeamName = function (team, callback) {
  cassandra.query(SELECT_PLAYERS_USING_SHORT_TEAM_CQL, [team], one, callback);
};

var SELECT_PLAYER_IMAGES_USING_PLAYERNAME = multiline(function() {/*
  SELECT * FROM player_images WHERE player_name = ?;
*/});
/**
 * !!!!!!!!!!!!!
 * TODO: NOT GOOD! Should move image into player image field
 * !!!!!!!!!!!!!
 * @param  {string}   playerName
 * @param  {Function} callback
 * args: (err, results)
 * where results is an array
 */
exports.selectImagesUsingPlayerName = function(playerName, callback) {
  cassandra.query(
    SELECT_PLAYER_IMAGES_USING_PLAYERNAME,
    [playerName],
    one,
    callback);
};

var AUTOCOMPLETE_QUERY = multiline(function() {/*
  SELECT athlete_id, full_name FROM baseball_player;
*/});
/**
 * selects all player names and ids
 * @param  {Function} callback
 * args: (err, result)
 * result is array of players with ids and fullnames
 */
exports.selectAllPlayerNames = function(callback) {
  cassandra.query(AUTOCOMPLETE_QUERY, [], one, callback);
}

var ADD_STATISTICS_QUERY = multiline(function() {/*
  UPDATE baseball_player SET statistics[?] = ? where athlete_id = ?;
*/});
/**
 * adds a single statistic to the player
 * @param {uuid}   athleteId
 * @param {string} formattedDate
 * date formatted as 'year/mm/dd'
 * @param {string}   statistic
 * stringified statistic
 * @param {Function} callback
 * args: (err)
 */
exports.addStatistic = function (athleteId, formattedDate, statistic, callback) {
  cassandra.query(
    ADD_STATISTICS_QUERY,
    [formattedDate, statistic, athleteId],
    one,
    callback);
};

var DELETE_SPECIFIC_STATISTICS_QUERY = multiline(function() {/*
  DELETE statistics[?] FROM baseball_player WHERE athlete_id = ?;
*/});
/**
 * @param  {uuid}   athleteId
 * @param  {string} formattedDate
 * @param  {Function} callback
 * args: (err)
 */
exports.deleteStatistics = function (athleteId, formattedDate, callback) {
  cassandra.query(
    DELETE_SPECIFIC_STATISTICS_QUERY,
    [formattedDate, athleteId],
    one,
    callback);
}