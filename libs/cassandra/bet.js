'use strict';
(require('rootpath')());

var cassandra = require('libs/cassandra/cql');
var cql = require('config/index.js').cassandra.cql;
var multiline = require('multiline');

var SELECT_BETS_MULTIPLE_CQL_1 = multiline(function () {/*
  SELECT * FROM
*/});
var SELECT_BETS_MULTIPLE_CQL_2 = multiline(function () {/*
  WHERE bet_id IN
*/});
/**
 * [selectMultiple description]
 * @param  {String}   bets_table [Must be one of the fields in allowed_tables]
 * @param  {[String]}   params     [Must be an array of bet_id's]
 * @param  {Function} callback   [Description]
 * @return {[Object] or {pending_bets: [Object], current_bets: [Object], past_bets: [Object]}}
 * [An array of bet_info's if bets_table is not 'all_bets', the object described above if otherwise]
 */
exports.selectMultiple = function selectMultiple(bets_table, params, callback) {
  var allowed_tables = ['pending_bets', 'current_bets', 'past_bets', 'all_bets'];
  var paramsLength = params.length;
  var filter = '';
  var query = '';
  var all_bets_result = {
    pending_bets: [],
    current_bets: [],
    past_bets: []
  };

  if (allowed_tables.indexOf(bets_table) < 0) {
    callback(new Error(bets_table + ' is not an allowed table.'));
  }

  for (var i = 0; i < paramsLength; i++) {
    filter += '?';

    if (i < (paramsLength - 1)) {
      filter += ', ';
    }
  }

  if (bets_table === 'all_bets') {
    selectMultiple('past_bets', params, function (err, result) {
      if (err) {
        callback(err);
      }

      all_bets_result.past_bets = result;
      selectMultiple('current_bets', params, function (err, result) {
        if (err) {
          callback(err);
        }

        all_bets_result.current_bets = result;
        selectMultiple('pending_bets', params, function (err, result) {
          if (err) {
            callback(err);
          }

          all_bets_result.pending_bets = result;
          callback(err, all_bets_result);
        });
      });
    });
  }
  else {
    query = SELECT_BETS_MULTIPLE_CQL_1 + ' ' + bets_table + ' ' + SELECT_BETS_MULTIPLE_CQL_2 + ' (' + filter + ');';
    cassandra.query(query, params, cql.types.consistencies.one,
      function (err, result) {
        console.log(result);
        callback(err, result);
      });
  }
}

var SELECT_BETS_USING_USER_ID_CQL = multiline(function () {/*
  SELECT * FROM user_id_to_bet_id WHERE
    user_id = ?;
*/});
/**
 * [selectUsingUserID description]
 * @param  {String}   bets_table [Must be one of the fields in allowed_tables]
 * @param  {String}   user_id    [Must be a user_id]
 * @param  {Function} callback   [Description]
 * @return {[Object] or {pending_bets: [Object], current_bets: [Object], past_bets: [Object]}}
 * [An array of bet_info's if bets_table is not 'all_bets', the object described above if otherwise, corresponding to user_id]
 */
exports.selectUsingUserID = function (bets_table, user_id, callback) {
  console.log(callback);
  var betIDs = [];

  cassandra.query(SELECT_BETS_USING_USER_ID_CQL,
      [user_id], cql.types.consistencies.one, 
      function(err, result) {
        if (err) {
          callback(err);
        }

        if (result) {
          for (var i = 0; i < result.length; i++) {
            betIDs[i] = result[i].bet_id;
          }

          exports.selectMultiple(bets_table, betIDs, function (err, result) {
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
*/});
exports.selectUsingPlayerID = function (bets_table, player_id, callback) {
  console.log(callback);
  var query = null;
  var allowed_tables = ['pending_bets', 'current_bets', 'past_bets'];

  if (allowed_tables.indexOf(bets_table) < 0) {
    callback(new Error(bets_table + ' is not an allowed table.'));
  }

  query = SELECT_BETS_USING_PLAYER_ID_CQL_1 + ' ' + bets_table + ' ' + SELECT_BETS_USING_PLAYER_ID_CQL_2;
  cassandra.query(query, [player_id], cql.types.consistencies.one, 
      function(err, result) {
        console.log(result);
        callback(err, result);
    });
}