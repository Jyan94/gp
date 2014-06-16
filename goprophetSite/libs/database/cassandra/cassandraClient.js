/**
 * exports cql and a cassandra Client instance that has been promisified
 * each method that has an Async postfixed is the promisified version
 */
'use strict';
(require('rootpath')());
var config = require('config/cassandraConfig.js');
var Bluebird = require('bluebird');
var cql = require('node-cassandra-cql');
var client = Bluebird.promisifyAll(new cql.Client(config));

module.exports = {
  cql : cql,
  client: client
};