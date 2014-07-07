'use strict';
(require('rootpath')());

var async = require('async');
var configs = require('config/index.js');
var ContestB = require('libs/cassandra/contestB/exports');
var POLL_INTERVAL = configs.constants.pollInterval;

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
    ContestB.selectOpen,
    filterContestFields
  ],
  function(err, results) {
    if (err) {
      console.log(err);
    }
    else {
      cachedContests = JSON.stringify(results);
    }
  });
}

//periodically update contests
setInterval(updateCachedContests, POLL_INTERVAL);

//!!!! need to make it such that it supports all types of contests
//should have getContests instead of directly send Contests
/*
 * ====================================================================
 * CONTEST TABLES
 * ====================================================================
 */

function renderContestPage(req, res) {
  res.render('contestB.hbs');
}

/*
 * ====================================================================
 * SEND CONTEST TABLES
 * ====================================================================
 */
function sendContestTable(req, res) {
  res.send(cachedContests);
}

exports.sendContestTable = sendContestTable;
exports.renderContestPage = renderContestPage;