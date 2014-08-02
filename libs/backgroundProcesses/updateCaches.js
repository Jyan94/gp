/**
 * ====================================================================
 * Author: Harrison Zhao
 * ====================================================================
 */
'use strict';
require('rootpath')();

var configs = require('config/index');
var contestAbets = require('libs/contestA/exports');
var athletes = require('libs/athletes/exports');
var customSetInterval = configs.constants.globals.customSetInterval;
var pollIntervals = configs.constants.pollIntervals;
var contestApollInterval = pollIntervals.contestA;
var athleteUpdateInterval = pollIntervals.athleteUpdate;

function startPollingContestABets() {
  contestAbets.UpdateGlobals.loadAllBets(function(err) {
    if (err) {
      console.log(err);
    }
    else {
      setTimeout(function() {
        startPollingContestABets();
      }, contestApollInterval);
    }
  });
}
exports.startPollingContestABets = startPollingContestABets;

function startPollingAthletes() {
  athletes.UpdateGlobals.updateAthletes(function(err) {
    if (err) {
      console.log(err);
    }
    else {
      setTimeout(function() {
        startPollingAthletes();
      }, athleteUpdateInterval);
    }
  });
}

function startPollingContestBContests() {
  customSetInterval(function(callback) {
    //add in content
  });
}

exports.start = function() {
  startPollingContestABets();
  startPollingAthletes();
}