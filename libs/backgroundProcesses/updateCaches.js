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
var contestATimeseriesPollInterval = pollIntervals.contestAtimeseries;
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

//currently not used
//will use if noticeable performance lag
function startPollingContestATimeseries() {
  contestAbets.UpdateGlobals.loadAllTimeseries(function(err) {
    if (err) {
      console.log(err);
    }
    else {
      setTimeout(function() {
        startPollingContestATimeseries();
      }, contestATimeseriesPollInterval);
    }
  });
}

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
  //disable timeseries caching for now since it is not necessary
  //startPollingContestATimeseries();
  startPollingAthletes();
}