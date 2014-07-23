/**
 * cassandra cql general query wrapping for returning rows
 */
'use strict';
(require('rootpath')());

var configs = require('config/index.js');
var client = configs.cassandra.client;
var cql = configs.cassandra.cql;

exports.query = function(cql, params, consistency, callback) {
  client.executeAsPrepared(cql, params, consistency, function(err, result) {
    if (result) {
      result = result.rows;
    }
    callback(err, result);
  });
};

exports.queryOneRow = function(cql, params, consistency, callback) {
  exports.query(cql, params, consistency, function(err, result) {
    if (result) {
      result = result[0];
    }
    callback(err, result);
  });
};

/**
 * performs a batch query
 * @param  {array}   cql
 * batch queries
 * @param  {cql.types.consistency}   consistency [description]
 * @param  {Function} callback
 * takes arguments err, result where result is number of retries
 */
exports.queryBatch = function(cql, consistency, callback) {
  client.executeBatch(cql, consistency, callback);
};

/**
 * function to allow one to select multiple columns
 * @param  {string}   cqlFirstHalf
 * string for first part of query
 * @param  {string}   cqlSecondHalf
 * string for last part of query
 * @param  {array}   fields
 * columns to select
 * @param  {[type]}   consistency   [description]
 * @param  {Function} callback      [description]
 */
exports.queryMultipleFields = function(
  cqlFirstHalf, cqlSecondHalf, fields, params, consistency, callback) {
  var query = cqlFirstHalf + ' ';
  for (var i = 0; i !== fields.length; ++i) {
    query += fields[i];
    if (i === fields.length - 1) {
      query += ','
    }
    query += ' ';
  }
  query += cqlSecondHalf;
  exports.query(query, params, consistency, callback);
}