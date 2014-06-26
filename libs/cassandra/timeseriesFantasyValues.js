'use strict';
require('rootpath')();

var cassandra = require('libs/cassandra/cql');
var cql = require('config/index.js').cassandra.cql;
var async = require('async');
var multiline = require('multiline');

var INSERT_PRICE_CQL = multiline(function() {/*
  INSERT INTO timeseries_fantasy_values (
    player_id, time, fantasy_value, virtual_money_wagered, contest_type
  ) VALUES  
    (?, ?, ?, ?, ?);
*/});

/**
 * inserts prices into timeseries 
 */
exports.insert = function (
  playerId, fantasyValue, virtualMoneyWagered, contestType, callback) {
  cassandra.query(
    INSERT_PRICE_CQL, 
    [
    playerId, 
    cql.types.timeuuid(), 
    {value: fantasyValue, hint: 'double'},
    virtualMoneyWagered,
    contestType
    ], 
    cql.types.consistencies.one,
    callback);
};

var DELETE_PRICES_CQL = multiline(function() {/*
  DELETE FROM timeseries_fantasy_values WHERE
    player_id
  IN
    (?);
*/});
exports.removeValue = function (playerId, callback) {
  cassandra.query(
    DELETE_PRICES_CQL,
    [playerId],
    cql.types.consistencies.one,
    callback);
}

var SELECT_TIMERANGE_CQL = multiline(function () {/*
  SELECT  
    price, dateOf(time) 
  FROM 
    timeseries_fantasy_values
  WHERE
    player_id=?
  AND
    time > maxTimeuuid(?)
  AND
    time < minTimeuuid(?)
*/});

/**
 * returns a list of rows for prices updated 
 * between two times: start and end
 * @param  {uuid}
 * playerId [player uniquely identified id]
 * @param  {Date object}   
 * start     [start date]
 * @param  {Date object}   
 * end       [end date]
 * @param  {Function} 
 * callback  [callback function to pass results]
 */
exports.selectTimeRange = function (playerId, start, end, callback) {
  cassandra.query(
    SELECT_TIMERANGE_CQL,
    [playerId, start, end], 
    cql.types.consistencies.one, 
    function(err, result) {
      callback(err, result);
  });
};

var UNTIL_NOW_CQL = multiline(function () {/*
  SELECT  
    price, dateOf(time) 
  FROM 
    timeseries_fantasy_values
  WHERE
    player_id=?
  AND
    time > maxTimeuuid(?)
  AND
    time < now()
*/});

/**
 * returns all rows for prices on a given player between start and now
 * @param  {uuid}`
 * playerId [player uniquely identified id]
 * @param  {Date object}   
 * start     [start date]
 * @param  {Date object}   
 * end       [end date]
 * @param  {Function} 
 * callback  [callback function to pass results]
 */
exports.selectSinceTime = function (playerId, start, callback) {
  cassandra.query(
    UNTIL_NOW_CQL,
    [playerId, start], 
    cql.types.consistencies.one, 
    function(err, result) {
      callback(err, result);
  });
};