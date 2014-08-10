/**
 * ====================================================================
 * Author: Taehoon Lee
 * ====================================================================
 */
'use strict';
require('rootpath')();

var configs = require('config/index');
var contestA = require('routes/contestA/contestA');
/*var athletes = require('libs/athletes/exports');
var games = require('libs/games/exports');*/
var customSetInterval = configs.constants.globals.customSetInterval;
var pollIntervals = configs.constants.pollIntervals;
var contestAPollInterval = pollIntervals.contestA;
/*var contestATimeseriesPollInterval = pollIntervals.contestAtimeseries;
var athleteUpdateInterval = pollIntervals.athleteUpdate;
var gameUpdateInterval = pollIntervals.gameUpdate;*/

function startUpdatingContestAPending () {
  customSetInterval(contestA.updateStateBetsPending, contestAPollInterval);
}

function startUpdatingContestAActive () {
  customSetInterval(contestA.updateStateBetsActive, contestAPollInterval);
} 

exports.start = function() {
  if (!configs.isDev()) {
    startUpdatingContestAPending();
    startUpdatingContestAActive();
  }
  //disable timeseries caching for now since it is not necessary
  //startPollingContestATimeseries();
}