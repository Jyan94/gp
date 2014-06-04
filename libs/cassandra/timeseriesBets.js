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
/*
var TIME_FIELD = 'dateOf(time)';
exports.reduceBetsToObject = function (prices, callback) {
  var retObj = {};
  var addToObj = function (element) {
    var price = element.price;
    console.log(price);
    //if (!retObj.hasOwnProperty(element[TIME_FIELD])) {
      retObj[element[TIME_FIELD]] =  price;
    //}
  };
  for (var i = 0; i !== prices.length; ++i) {
    addToObj(prices[i]);
  }
  callback(retObj);
}
*/
/**
 * TEST FUNCTION BELOW
 */
function test1() {
  var i = 0;
  var playerId = 'hello';
  var date = new Date();
  var print = function(err, result) {
    if (err) {
      console.log(err);
    }
    var j;
    for (j = 0; j !== result.length; ++j) {
      console.log('%s, ----- %s', result[j]['dateOf(time)'], result[j].price)
    }
  };
  var callback = function (err) {
    if (err) {
      console.log(err);
    } else {
      exports.selectSinceTime(playerId, date, print);
    }
  };
  var arr = [];
  for (i = 0; i !== 100; ++i) {
    arr.push(i);
  }
  async.each(
    arr, 
    function(index, callback) {
      exports.insert(playerId, index, callback);
    }, 
    function (err) {
      callback(err);
    });
}

function test2() {
  var date = new Date(2014, 5, 2);
  exports.selectSinceTime('hello', date, function(err, result) {
    if (err) {
      console.log(err);
    }
    for (var j = 0; j !== result.length; ++j) {
      console.log('%s, ----- %s', result[j]['dateOf(time)'], result[j].price)
    }
    /*exports.reduceBetsToObject(result, function(res) {
      console.log(res);
    });*/
  });
}
//test1();
//test2();