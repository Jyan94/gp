/**
 * ====================================================================
 * Author: Harrison Zhao
 * ====================================================================
 */
'use strict';
require('rootpath')();

var configs = require('config/index');
var contestAbets = require('libs/contestA/exports');
var customSetInterval = configs.constants.globals.customSetInterval;
var POLL_INTERVAL = configs.constants.pollInterval;

function startPollingContestABets() {
  customSetInterval(function(callback) {
    contestAbets.UpdateGlobals.loadAllBets(callback);
  }, POLL_INTERVAL);
}
exports.startPollingContestABets = startPollingContestABets;

function startPollingContestBContests() {
  customSetInterval(function(callback) {
    //add in content
  });
}

exports.start = function() {
  startPollingContestABets();
}