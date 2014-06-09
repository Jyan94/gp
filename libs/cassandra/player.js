'use strict';
(require('rootpath')());

var cassandra = require('libs/cassandra/cql');
var cql = require('config/index.js').cassandra.cql;
var multiline = require('multiline');

var INSERT_PLAYER_CQL = multiline(function() {/*
  INSERT INTO footballPlayer (
    playerId, currentValue, fullName, firstName, lastName, team, age, biography
  ) VALUES
    (?, ?, ?, ?, ?, ?, ?, ?);
*/});
exports.insert = function (fields, callback) {
  //parse values
  cassandra.query(INSERT_PLAYER_CQL, fields, cql.types.consistencies.one,
    function (err) {
      callback(err);
    });
};

var DELETE_PLAYER_CQL = multiline(function() {/*
  DELETE FROM footballPlayer WHERE playerId = ?;
*/});
exports.delete = function (playerId, callback) {
  cassandra.query(DELETE_PLAYER_CQL, [playerId], cql.types.consistencies.one,
    function (err) {
      callback(err);
    });
};

var UPDATE_PLAYER_CQL_1 = multiline(function() {/*
  UPDATE footballPlayer SET
*/});
var UPDATE_PLAYER_CQL_2 = multiline(function() {/*
  WHERE
    playerId = ?;
*/});
exports.update = function (playerId, fields, params, callback) {
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
    params.concat([playerId]), cql.types.consistencies.one,
    function (err) {
      callback(err);
    });
};

var SELECT_PLAYER_CQL = multiline(function () {/*
  SELECT * FROM footballPlayer WHERE playerId = ?;
*/});
exports.select = function (playerId, callback) {
  cassandra.queryOneRow(SELECT_PLAYER_CQL,
    [playerId], cql.types.consistencies.one,
    function(err, result) {
      callback(err, result);
    });
}

var SELECT_PLAYERS_USING_TEAM_CQL = multiline(function () {/*
  SELECT * FROM footballPlayer WHERE team = ?;
*/});
exports.selectUsingTeam = function (team, callback) {
  cassandra.query(SELECT_PLAYERS_USING_TEAM_CQL, 
    [team], cql.types.consistencies.one,
    function(err, result) {
      callback(err, result);
    });
}

var SELECT_PLAYER_IMAGES_USING_PLAYERNAME = multiline(function() {/*
  SELECT * FROM playerImages WHERE playerName = ?;
*/});
exports.selectImagesUsingPlayerName = function(playerName, callback) {
  var query = SELECT_PLAYER_IMAGES_USING_PLAYERNAME;

  cassandra.query(query, [playerName], cql.types.consistencies.one,
    function(err, result) {
      callback(err, result);
    }
  );
}

var AUTOCOMPLETE_QUERY = multiline(function() {/*
  SELECT playerId, fullName FROM footballPlayer
*/});
exports.selectAllPlayerNames = function(callback) {
  cassandra.query(AUTOCOMPLETE_QUERY, [], cql.types.consistencies.one,
    function(err, result) {
      callback(err, result);
    }
  );
}