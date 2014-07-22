/**
 * ====================================================================
 * Author: Harrison Zhao
 * ====================================================================
 */
'use strict';
(require('rootpath')());

var cassandra = require('libs/cassandra/cql');
var cql = require('config/index.js').cassandra.cql;
var async = require('async');
var multiline = require('multiline');

var INSERT_PRICE_CQL = multiline(function() {/*
  INSERT INTO timeseries_daily_prophet (
    athlete_id, time, fantasy_value, virtual_money_wagered, username, active
  ) VALUES  
    (?, ?, ?, ?, ?, ?);
*/});

/**
 * inserts prices into timeseries and sets it as an active prediction
 * @param  {uuid}   athleteId
 * @param  {double}   fantasyValue
 * @param  {int}   virtualMoneyWagered
 * @param  {string}   username
 * username for user who made the prediction
 * @param  {Function} callback
 * args: (err)
 */
function insert(athleteId,fantasyValue,virtualMoneyWagered,username,callback) {
  cassandra.query(
    INSERT_PRICE_CQL, 
    [
    athleteId, 
    cql.types.timeuuid(), 
    {value: fantasyValue, hint: 'double'},
    virtualMoneyWagered,
    username,
    true  //active
    ], 
    cql.types.consistencies.one,
    callback);
}
exports.insert = insert;

var DELETE_VALUES_CQL = multiline(function() {/*
  DELETE FROM timeseries_daily_prophet WHERE
    athlete_id
  IN
    (?);
*/});

/**
 * removes all timeseries values associated with athleteId
 * @param  {uuid}   athleteId
 * @param  {Function} callback
 * args: (err)
 */
function removeValues(athleteId, callback) {
  cassandra.query(
    DELETE_VALUES_CQL,
    [athleteId],
    cql.types.consistencies.one,
    callback);
}
exports.removeValues = removeValues;

var SELECT_TIMERANGE_FOR_DISPLAY_CQL = multiline(function () {/*
  SELECT  
    fantasy_value, dateOf(time)
  FROM 
    timeseries_daily_prophet
  WHERE
    athlete_id=?
  AND
    time > maxTimeuuid(?)
  AND
    time < minTimeuuid(?)
*/});

var SELECT_TIMERANGE_CQL = multiline(function () {/*
  SELECT  
    fantasy_value, dateOf(time), virtual_money_wagered, username, active
  FROM 
    timeseries_daily_prophet
  WHERE
    athlete_id=?
  AND
    time > maxTimeuuid(?)
  AND
    time < minTimeuuid(?)
*/});

/**
 * returns a list of rows for prices updated between two times: start and end
 * @param  {uuid}     athleteId
 * @param  {object}   start
 * Date Object
 * @param  {object}   end
 * Date Object
 * @param  {Function} callback  
 * args: (err, result)
 * where result is an array
 */
function selectTimeRange(athleteId, start, end, callback) {
  cassandra.query(
    SELECT_TIMERANGE_FOR_DISPLAY_CQL,
    [athleteId, start, end], 
    cql.types.consistencies.one, 
    function(err, result) {
      callback(err, result);
  });
}
exports.selectTimeRange= selectTimeRange;

var UNTIL_NOW_CQL = multiline(function () {/*
  SELECT  
    fantasy_value, dateOf(time) 
  FROM 
    timeseries_daily_prophet
  WHERE
    athlete_id=?
  AND
    time > maxTimeuuid(?)
  AND
    time < now()
*/});

/**
 * returns all rows for prices on a given player between start and now
 * @param  {uuid}     athleteId
 * @param  {object}   start
 * Date Object
 * @param  {Function} callback  
 * args: (err, result)
 * where result is an array
 */
function selectSinceTime(athleteId, start, callback) {
  cassandra.query(
    UNTIL_NOW_CQL,
    [athleteId, start], 
    cql.types.consistencies.one, 
    function(err, result) {
      callback(err, result);
  });
}
exports.selectSinceTime = selectSinceTime;

var SELECT_ACTIVE_CQL = multiline(function () {/*
  SELECT  
    *
  FROM 
    timeseries_daily_prophet
  WHERE
    athlete_id=?
  AND
    active = true;
*/});

/**
 * selects all the active predictions for a given player
 * active refers to if the prediction was made for a contest not yet resolved
 * this is how the five-for-five determines which values are up to date
 * @param  {uuid}   athleteId
 * @param  {Function} callback
 * args: (err, result) where result is an array of values
 */
function selectActivePlayerValues(athleteId, callback) {
  cassandra.query(
    SELECT_ACTIVE_CQL,
    [athleteId], 
    cql.types.consistencies.one, 
    callback);
}
exports.selectActivePlayerValues = selectActivePlayerValues;