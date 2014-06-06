'use strict';
require('rootpath')();

var cassandra = require('libs/cassandra/cql');
var cql = require('config/index.js').cassandra.cql;
var async = require('async');
var multiline = require('multiline');

var INSERT_PRICE_CQL = multiline(function() {/*
  INSERT INTO timeseries_bets (
    player_id, time, price
  ) VALUES 
    (?, ?, ?);
*/});

/**
 * inserts prices into timeseries 
 */
exports.insert = function (player_id, price, callback) {
  //parse values
  cassandra.query(
    INSERT_PRICE_CQL, 
    [player_id, cql.types.timeuuid(), {value: price, hint: 'double'}], 
    cql.types.consistencies.one,
    function (err) {
      callback(err);
    });
};

var DELETE_PRICE_CQL = multiline(function() {/*
  DELETE FROM timeseries_bets WHERE
    player_id
  IN
    (?);
*/});
exports.deletePrices = function (player_id, callback) {
  cassandra.query(
    DELETE_PRICE_CQL,
    [player_id],
    cql.types.consistencies.one,
    function (err) {
      callback(err);
    });
}

var SELECT_TIMERANGE_CQL = multiline(function () {/*
  SELECT  
    price, dateOf(time) 
  FROM 
    timeseries_bets
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
 * player_id [player uniquely identified id]
 * @param  {Date object}   
 * start     [start date]
 * @param  {Date object}   
 * end       [end date]
 * @param  {Function} 
 * callback  [callback function to pass results]
 */
exports.selectTimeRange = function (player_id, start, end, callback) {
  cassandra.query(
    SELECT_TIMERANGE_CQL,
    [player_id, start, end], 
    cql.types.consistencies.one, 
    function(err, result) {
      callback(err, result);
  });
};

var UNTIL_NOW_CQL = multiline(function () {/*
  SELECT  
    price, dateOf(time) 
  FROM 
    timeseries_bets
  WHERE
    player_id=?
  AND
    time > maxTimeuuid(?)
  AND
    time < now()
*/});

/**
 * returns all rows for prices on a given player between start and now
 * @param  {uuid}
 * player_id [player uniquely identified id]
 * @param  {Date object}   
 * start     [start date]
 * @param  {Date object}   
 * end       [end date]
 * @param  {Function} 
 * callback  [callback function to pass results]
 */
exports.selectSinceTime = function (player_id, start, callback) {
  cassandra.query(
    UNTIL_NOW_CQL,
    [player_id, start], 
    cql.types.consistencies.one, 
    function(err, result) {
      callback(err, result);
  });
};