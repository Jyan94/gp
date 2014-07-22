'use strict';
require('rootpath')();

var cassandra = require('libs/cassandra/cql');
var cql = require('config/index.js').cassandra.cql;
var async = require('async');
var multiline = require('multiline');

var DELIM = '-';

var INSERT_PRICE_CQL = multiline(function() {/*
  INSERT INTO timeseries_contest_a_bets (
    athlete_id, time, price
  ) VALUES 
    (?, ?, ?);
*/});

/**
 * inserts prices into timeseries 
 * need to take out '-' in player_id in order to place it as key in database
 */
exports.insert = function (playerId, price, callback) {
  cassandra.query(
    INSERT_PRICE_CQL, 
    [
    playerId.split(DELIM).join(''), 
    cql.types.timeuuid(), 
    {value: price, hint: 'double'}
    ], 
    cql.types.consistencies.one,
    function (err) {
      callback(err);
    });
};

var DELETE_PRICE_CQL = multiline(function() {/*
  DELETE FROM timeseries_contest_a_bets WHERE
    athlete_id
  IN
    (?);
*/});
exports.deletePrices = function (playerId, callback) {
  cassandra.query(
    DELETE_PRICE_CQL,
    [playerId.split(DELIM).join('')],
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
    athlete_id=?
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
exports.selectTimeRange = function (athleteId, start, end, callback) {
  cassandra.query(
    SELECT_TIMERANGE_CQL,
    [athleteId, start, end], 
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
    [playerId.split(DELIM).join(''), start], 
    cql.types.consistencies.one, 
    function(err, result) {
      callback(err, result);
  });
};