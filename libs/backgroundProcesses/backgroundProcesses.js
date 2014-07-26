/**
 * ====================================================================
 * Author: Harrison Zhao
 * ====================================================================
 */
'use strict';
require('rootpath')();

var configs = require('config/index');
var contestAbets = require('libs/contestA/updateGlobals');
var customSetInterval = configs.constants.globals.customSetInterval;
var POLL_INTERVAL = configs.constants.pollInterval;

function startPollingContestABets() {
  customSetInterval(function(callback) {
    contestAbets.loadAllBets(callback);
  }, POLL_INTERVAL);
}
exports.startPollingContestABets = startPollingContestABets;

exports.start = function() {
  startPollingContestABets();
}