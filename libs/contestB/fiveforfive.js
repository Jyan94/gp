/**
 * ====================================================================
 * Author: Harrison Zhao
 * ====================================================================
 */
'use strict';
(require('rootpath')());

var ContestB = require('libs/cassandra/contestB/exports');
var User = require('libs/cassandra/user');

var async = require('async');

function fiveForFive(user, playerId, callback) {
  async.waterfall([
    function(callback) {
      ContestB.timeseries.selectActivePlayerValues(playerId, callback);
    },
    function(fantasyValues, callback) {
      
    }
  ])
}