'use strict';
require('rootpath')();

var cassandra = require('libs/cassandra/cql');
var cql = require('config/index.js').cassandra.cql;
var multiline = require('multiline');

var INSERT_GAME_CQL = multiline(function() {/*
  INSERT INTO baseball_game (
    gsis_id,
    start_time,
    date,
    home_team,
    away_team,
    home_score,
    away_score,
    status
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);

*/});

exports.insertGameSchedule = function(fields, callback) {
  cassandra.query(
    INSERT_GAME_CQL,
    fields,
    cql.types.consistencies.one,
    callback);
};

var UPDATE_GAME_CQL = multiline(function() {/*
  UPDATE baseball_game SET start_time = ?,
  date = ?,
  home_team = ?,
  away_team = ?,
  home_score = ?,
  away_score = ?,
  status = ?
  WHERE gsis_id = ?
*/});

exports.updateGameSchedule = function(fields, callback) {
  cassandra.query(UPDATE_GAME_CQL, fields, cql.types.consistencies.one, callback);
}

var SELECT_GAME_CQL = multiline(function() {/*
  SELECT * FROM baseball_game WHERE gsis_id = ?;
*/})

exports.selectGameUsingId = function(id, callback) {
  cassandra.query(SELECT_GAME_CQL, [id], cql.types.consistencies.one, callback);
};

var SELECT_GAME_DATE = multiline(function() {/*
  SELECT * FROM baseball_game WHERE date = ?;
*/});

exports.selectGameUsingDate = function(date, callback) {
  cassandra.query(SELECT_GAME_DATE,
    [date],
    cql.types.consistencies.one,
    callback);
};


/**
 *
CREATE TABLE IF NOT EXISTS baseball_player_game_statistics (
  game_id uuid PRIMARY KEY,
  player_id uuid,
  sport text,
  date timestamp,
  season_year int,
  season_type text,
  position_in_game text,
  singles int,
  doubles int,
  triples int,
  home runs int,
  runs int,
  rbis int,
  stolen_bases int,
  caught_stealing_bases int,
  walks int,
  earned_runs_allowed int,
  strikeouts int,
  walks_and_hits_allowed int,
  fantasy_points double
);
 */
