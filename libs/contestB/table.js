/**
 * ====================================================================
 * Author: Harrison Zhao
 * ====================================================================
 */
'use strict';
(require('rootpath')());

var async = require('async');
var configs = require('config/index.js');
var ContestB = require('libs/cassandra/contestB/exports');
var POLL_INTERVAL = configs.constants.pollInterval;
//TODO implement better caching, use timestamps to update instead of setInterval
/*
 * ====================================================================
 * CACHED CONTESTS AND UPDATING CACHED CONTESTS
 * ====================================================================
 */
//Stringified array of of contests
var cachedContests;

function filterContestFields(contests, callback) {
  var filterFunction = function (contest, callback) {
    callback(
      null, 
      { 
        contestId: contest.contest_id,
        sport: contest.sport,
        type: contest.contest_name,
        contestStartTime: contest.contest_start_time,
        currentEntries: contest.current_entries,
        maximumEntries: contest.maximum_entries,
        entryFee: contest.entry_fee,
        totalPrizePool: contest.total_prize_pool,
        startingVirtualMoney: contest.starting_virtual_money
      });
  };

  async.map(contests, filterFunction, callback);
}

function updateCachedContests() {
  async.waterfall(
  [ 
    function(callback) {
      ContestB.selectOpen('TEST_SPORT', callback);
    },
    filterContestFields
  ],
  function(err, results) {
    if (err) {
      console.log(err);
    }
    else {
      cachedContests = results;
    }
  });
}

//periodically update contests
setInterval(updateCachedContests, POLL_INTERVAL);

function getContests() {
  return cachedContests;
}

exports.getContests = getContests;