'use strict';
require('rootpath')();

var cassandra = require('libs/cassandra/cql');
var cql = require('config/index.js').cassandra.cql;
var multiline = require('multiline');

var INSERT_PLAYER_CQL = multiline(function() {/*
  INSERT INTO football_player (
    athlete_id, current_value, full_name, first_name, last_name, team, status,
    position, profile_url, uniform_number, height, weight, age, image
  ) VALUES
    (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
*/});

exports.insert = function (fields, callback) {
  cassandra.query(INSERT_PLAYER_CQL, fields, cql.types.consistencies.one,
    function (err) {
      callback(err);
    });
};

var DELETE_PLAYER_CQL = multiline(function() {/*
  DELETE FROM football_player WHERE athlete_id = ?;
*/});
exports.delete = function (athleteId, callback) {
  cassandra.query(DELETE_PLAYER_CQL, [athleteId], cql.types.consistencies.one,
    function (err) {
      callback(err);
    });
};

var UPDATE_PLAYER_CQL_1 = multiline(function() {/*
  UPDATE football_player SET
*/});
var UPDATE_PLAYER_CQL_2 = multiline(function() {/*
  WHERE
    athlete_id = ?;
*/});
exports.update = function (athleteId, fields, params, callback) {
  var fieldsLength = fields.length;
  var paramsLength = params.length;
  var updates = '';

  if (fields.length !== params.length) {
    callback(new Error('Number of fields and parameters are not the same.'));
  }

  for (var i = 0; i < fieldsLength; i++) {
    updates += (fields[i] + ' = ?');

    if (i < (fieldsLength - 1)) {
      updates += ', ';
    }
  }

  cassandra.query(UPDATE_PLAYER_CQL_1 + ' ' + updates + ' '
    + UPDATE_PLAYER_CQL_2,
    params.concat([athleteId]), cql.types.consistencies.one,
    function (err) {
      callback(err);
    });
};

var SELECT_PLAYER_CQL = multiline(function () {/*
  SELECT * FROM football_player WHERE athlete_id = ?;
*/});
exports.select = function (athleteId, callback) {
  cassandra.queryOneRow(SELECT_PLAYER_CQL,
    [athleteId], cql.types.consistencies.one,
    function(err, result) {
      callback(err, result);
  });
};

var SELECT_PLAYERS_USING_TEAM_CQL = multiline(function () {/*
  SELECT * FROM football_player WHERE team = ?;
*/});
exports.selectUsingTeam = function (team, callback) {
  cassandra.query(SELECT_PLAYERS_USING_TEAM_CQL, 
    [team], cql.types.consistencies.one,
    function(err, result) {
      callback(err, result);
    });
}

var SELECT_PLAYER_IMAGES_USING_PLAYERNAME = multiline(function() {/*
  SELECT * FROM player_images WHERE player_name = ?;
*/});
exports.selectImagesUsingPlayerName = function(playerName, callback) {
  cassandra.query(SELECT_PLAYER_IMAGES_USING_PLAYERNAME,
    [playerName], cql.types.consistencies.one,
    function(err, result) {
      callback(err, result);
    }
  );
}

var AUTOCOMPLETE_QUERY = multiline(function() {/*
  SELECT athlete_id, full_name FROM football_player
*/});
exports.selectAllPlayerNames = function(callback) {
  cassandra.query(AUTOCOMPLETE_QUERY, [], cql.types.consistencies.one,
    function(err, result) {
      callback(err, result);
    }
  );
}