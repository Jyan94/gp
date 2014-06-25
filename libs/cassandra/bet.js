'use strict';
(require('rootpath')());

var cassandra = require('libs/cassandra/cql');
var cql = require('config/index.js').cassandra.cql;
var multiline = require('multiline');

var INSERT_PENDING_BET_CQL_1 = multiline(function() {/*
  INSERT INTO user_id_to_bet_id (user_id, bet_id) VALUES (?, ?);
*/});
var INSERT_PENDING_BET_CQL_2 = multiline(function() {/*
  INSERT INTO pending_bets (
    bet_id, user_id, long_position, player_id, bet_value, multiplier, game_id,
    expiration
  ) VALUES
    (?, ?, ?, ?, ?, ?, ?, ?);
*/});
exports.insertPending = function (params, callback) {
  var query = [
  {
    query: INSERT_PENDING_BET_CQL_1,
    params: [params[1], params[0]]
  },
  {
    query: INSERT_PENDING_BET_CQL_2,
    params: params
  }
  ];

  cassandra.queryBatch(query, cql.types.consistencies.one, callback);
};


var INSERT_CURRENT_BET_CQL_1 = multiline(function() {/*
  DELETE FROM pending_bets WHERE bet_id = ?;
*/});
var INSERT_CURRENT_BET_CQL_2 = multiline(function() {/*
  INSERT INTO user_id_to_bet_id (user_id, bet_id) VALUES (?, ?);
*/});
var INSERT_CURRENT_BET_CQL_3 = multiline(function() {/*
  INSERT INTO current_bets (
    bet_id, long_better_id, short_better_id, player_id, bet_value, multiplier,
    game_id, expiration
  ) VALUES
    (?, ?, ?, ?, ?, ?, ?, ?);
*/});
exports.insertCurrent = function(takerUserId, params, callback) {
  var query = [
    {
      query: INSERT_CURRENT_BET_CQL_1,
      params: [params[0]]
    },
    {
      query: INSERT_CURRENT_BET_CQL_2,
      params: [takerUserId, params[0]]
    },
    {
      query: INSERT_CURRENT_BET_CQL_3,
      params: params
    }
  ];

  cassandra.queryBatch(query, cql.types.consistencies.one, callback);
}

var INSERT_PAST_BET_CQL_1 = multiline(function() {/*
  DELETE FROM current_bets WHERE bet_id = ?;
*/});
var INSERT_PAST_BET_CQL_2 = multiline(function() {/*
  INSERT INTO past_bets (
    bet_id, long_better_id, short_better_id, player_id, bet_value, multiplier,
    long_better_payoff, short_better_payoff, game_id, expiration
  ) VALUES
    (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
*/});
exports.insertPast = function(params, callback) {
  var query = [
    {
      query: INSERT_PAST_BET_CQL_1,
      params: [params[0]]
    },
    {
      query: INSERT_PAST_BET_CQL_2,
      params: params
    }
  ];

  cassandra.queryBatch(query, cql.types.consistencies.one, callback);
}

var DELETE_BET_CQL_1 = multiline(function () {/*
  DELETE FROM user_id_to_bet_id WHERE user_id = ? AND bet_id = ?;
*/});
var DELETE_BET_CQL_2 = multiline(function () {/*
  DELETE FROM
*/});
var DELETE_BET_CQL_3 = multiline(function () {/*
  WHERE bet_id = ?;
*/});
exports.delete = function(betsTable, betId, callback) {
  var allowedTables = ['pending_bets', 'current_bets', 'past_bets', 'all_bets'];
  var query =[];

  if (allowedTables.indexOf(betsTable) < 0) {
    callback(new Error(betsTable + ' is not an allowed table.'));
  }

  exports.selectMultiple(betsTable, [betId],
    function (err, result) {
      if (result.length === 0) {
        callback(null);
      }
      else if (result.length > 1) {
        callback(new Error('WTF'));
      }
      else {
        if (betsTable === 'pending_bets') {
          query = [
            {
              query: DELETE_BET_CQL_1,
              params: [result[0].user_id, betId]
            },
            {
              query: DELETE_BET_CQL_2 + ' ' + betsTable + ' ' + DELETE_BET_CQL_3,
              params: [betId]
            },
          ];
        }
        else {
          query = [
            {
              query: DELETE_BET_CQL_1,
              params: [result[0].long_better_id, betId]
            },
            {
              query: DELETE_BET_CQL_1,
              params: [result[0].short_better_id, betId]
            },
            {
              query: DELETE_BET_CQL_2 + ' ' + betsTable + ' ' + DELETE_BET_CQL_3,
              params: [betId]
            },
          ];
        }

        cassandra.queryBatch(query, cql.types.consistencies.one, callback);
      }
    });
}

var SELECT_BETS_MULTIPLE_CQL_1 = multiline(function () {/*
  SELECT * FROM
*/});
var SELECT_BETS_MULTIPLE_CQL_2 = multiline(function () {/*
  WHERE bet_id IN
*/});

/**
 * [selectMultiple description]
 * @param  {String}   betsTable [Must be one of the fields in allowedTables]
 * @param  {[String]}   params     [Must be an array of bet_id's]
 * @param  {Function} callback   [Description]
 * @return
 * {[Object] or
 * {
 * pending_bets: [Object],
 * current_bets: [Object],
 * past_bets: [Object]
 * }}
 * [An array of bet_info's if bets_table is not 'all_bets',
 * the object described above if otherwise]
 */
exports.selectMultiple = function selectMultiple(betsTable, params, callback) {
  var allowedTables = ['pending_bets', 'current_bets', 'past_bets', 'all_bets'];
  var paramsLength = params.length;
  var filter = '';
  var query = '';
  var allBetsResult = {
    pendingBets: [],
    currentBets: [],
    pastBets: []
  };

  if (allowedTables.indexOf(betsTable) < 0) {
    callback(new Error(betsTable + ' is not an allowed table.'));
  }

  for (var i = 0; i < paramsLength; i++) {
    filter += '?';

    if (i < (paramsLength - 1)) {
      filter += ', ';
    }
  }

  if (betsTable === 'all_bets') {
    selectMultiple('past_bets', params, function (err, result) {
      if (err) {
        callback(err);
      }

      allBetsResult.pastBets = result;
      selectMultiple('current_bets', params, function (err, result) {
        if (err) {
          callback(err);
        }

        allBetsResult.currentBets = result;
        selectMultiple('pending_bets', params, function (err, result) {
          if (err) {
            callback(err);
          }

          allBetsResult.pendingBets = result;
          callback(err, allBetsResult);
        });
      });
    });
  } else {
    query =
      SELECT_BETS_MULTIPLE_CQL_1 + ' ' +
      betsTable + ' ' +
      SELECT_BETS_MULTIPLE_CQL_2 + ' (' +
      filter + ');';
    cassandra.query(query, params, cql.types.consistencies.one, callback);
  }
}

var SELECT_BETS_USING_USER_ID_CQL = multiline(function () {/*
  SELECT * FROM user_id_to_bet_id WHERE
    user_id = ?;
*/});

/**
 * [selectUsingUserID description]
 * @param  {String}   betsTable [Must be one of the fields in allowedTables]
 * @param  {String}   userId    [Must be a user_id]
 * @param  {Function} callback   [Description]
 * @return
 * {[Object] or
 * {
 * pendingBets: [Object],
 * currentBets: [Object],
 * pastBets: [Object]
 * }}
 * [An array of betInfo's if betsTable is not 'all_bets',
 * the object described above if otherwise, corresponding to userId]
 */
exports.selectUsingUserId = function (betsTable, userId, callback) {
  var betIds = [];

  cassandra.query(SELECT_BETS_USING_USER_ID_CQL,
      [userId], cql.types.consistencies.one,
      function(err, result) {
        if (err) {
          callback(err);
        }

        if (result) {
          for (var i = 0; i < result.length; i++) {
            betIds[i] = result[i].bet_id;
          }

          exports.selectMultiple(betsTable, betIds, function (err, result) {
            callback(err, result);
          });
        }
    });
}

var SELECT_BETS_USING_PLAYER_ID_CQL_1 = multiline(function () {/*
  SELECT * FROM
*/})
var SELECT_BETS_USING_PLAYER_ID_CQL_2 = multiline(function () {/*
  WHERE player_id = ?;
*/})
exports.selectUsingPlayerId = function (betsTable, playerId, callback) {
  var query = null;
  var allowedTables = ['pending_bets', 'current_bets', 'past_bets'];

  if (allowedTables.indexOf(betsTable) < 0) {
    callback(new Error(betsTable + ' is not an allowed table.'));
  }

  query =
    SELECT_BETS_USING_PLAYER_ID_CQL_1 + ' ' +
    betsTable + ' ' +
    SELECT_BETS_USING_PLAYER_ID_CQL_2;
  cassandra.query(query, [playerId], cql.types.consistencies.one,
    function(err, result) {
      callback(err, result);
    });
}