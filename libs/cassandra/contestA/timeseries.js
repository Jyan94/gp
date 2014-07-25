/**
 * ====================================================================
 * Author: Harrison Zhao
 * ====================================================================
 */
'use strict';
require('rootpath')();

var cassandra = require('libs/cassandra/cql');
var cql = require('config/index.js').cassandra.cql;
var async = require('async');
var multiline = require('multiline');
var one = cql.types.consistencies.one;

var INSERT_PRICE_CQL = multiline(function() {/*
  INSERT INTO timeseries_contest_a_bets (
    athlete_id, fantasy_value, price, time
  ) VALUES 
    (?, ?, ?, ?);
*/});

/**
 * inserts prices into timeseries 
 * @param  {uuid}   athleteId
 * @param  {double} fantasyValue
 * @param  {double}   price
 * @param  {Function} callback
 * args: err
 */
exports.insert = function (athleteId, fantasyValue, price, callback) {
  cassandra.query(
    INSERT_PRICE_CQL, 
    [
    athleteId,
    {value: fantasyValue, hint: 'double'},
    {value: price, hint: 'double'},
    cql.types.timeuuid()
    ], 
    one,
    callback);
};

var DELETE_PRICE_CQL = multiline(function() {/*
  DELETE FROM timeseries_contest_a_bets WHERE athlete_id = ?;
*/});
/**
 * deletes bets from database
 * @param  {uuid}   athleteId
 * @param  {Function} callback
 * args: err
 */
exports.deletePrices = function (athleteId, callback) {
  cassandra.query(
    DELETE_PRICE_CQL,
    [athleteId],
    one,
    function(err) {
      callback(err);
    });
}

var SELECT_TIMERANGE_CQL = multiline(function () {/*
  SELECT  
    fantasy_value, dateOf(time) 
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
 * athleteId [player uniquely identified id]
 * @param  {Date object}   
 * start     [start date]
 * @param  {Date object}   
 * end       [end date]
 * @param  {Function} 
 * callback
 * args: err, result
 */
exports.selectTimeRange = function (athleteId, start, end, callback) {
  cassandra.query(
    SELECT_TIMERANGE_CQL,
    [athleteId, start, end], 
    one,
    callback);
};

var UNTIL_NOW_CQL = multiline(function () {/*
  SELECT  
    fantasy_value, dateOf(time) 
  FROM 
    timeseries_bets
  WHERE
    athlete_id=?
  AND
    time > maxTimeuuid(?)
  AND
    time < now()
*/});

/**
 * returns all rows for prices on a given player between start and now
 * @param  {uuid}
 * athleteId [player uniquely identified id]
 * @param  {Date object}   
 * start     [start date]
 * @param  {Date object}   
 * end       [end date]
 * @param  {Function} 
 * callback  [callback function to pass results]
 * args: err, results
 */
exports.selectSinceTime = function (athleteId, start, callback) {
  cassandra.query(
    UNTIL_NOW_CQL,
    [athleteId, start], 
    one,
    callback);
};