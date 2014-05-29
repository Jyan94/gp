/**
 * cassandra cql general
 */
'use strict';
(require('rootpath')());

var configs = require('config/index.js');
var client = configs.cassandra.client;
var cql = configs.cassandra.cql;

exports.query = function(cql, params, consistency, callback) {
  //console.log(callback.toString());
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