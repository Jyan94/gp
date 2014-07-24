/**
 * ====================================================================
 * Author: Harrison Zhao
 * ====================================================================
 */
'use strict';
require('rootpath')();

var configs = require('config/index');
var contestAbets = require('libs/contestA/updateGlobals');
var POLL_INTERVAL = configs.constants.pollInterval;

function startPollingContestABets() {
  setInterval(function() {
    contestAbets.loadAllBets(function(err) {
      if (err) {
        console.log(err);
      } 
    });
  }, POLL_INTERVAL);
}
exports.startPollingContestABets = startPollingContestABets;

exports.start = function() {
  startPollingContestABets();
}