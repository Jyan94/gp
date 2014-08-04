/**
 * ====================================================================
 * Author: Harrison Zhao
 * ====================================================================
 */
'use strict';
require('rootpath')();

var configs = require('config/index');
var async = require('async');
var ContestA = require('libs/cassandra/contestA/exports');
var Timeseries = ContestA.Timeseries;

var contestAGlobals = configs.globals.contestA;
var contestAConstants = configs.constants.contestAbets;
var TIMEFIELD = contestAConstants.TIMESERIES_TIMEFIELD;

/**
 * @param  {uuid}   athleteId
 * @param  {int}   timeAgo
 * milliseconds to look in the past
 * @param  {Function} callback
 * args: (err, result)
 */
function getByAthleteId(athleteId, timeAgo, callback) {
  var defaultTimeAgo = contestAConstants.TIMESERIES_MILLISECONDS_AGO();
  timeAgo = timeAgo || defaultTimeAgo;
  if (timeAgo < defaultTimeAgo) {
    timeAgo = defaultTimeAgo;
    console.log(timeAgo);
    console.log(typeof(timeAgo));
  }
  async.waterfall(
  [
    function(callback) {
      Timeseries.limitSelectSinceTime(athleteId, timeAgo, callback);
    },
    function(dataPoints, callback) {
      console.log(dataPoints);
      async.map(
        dataPoints, 
        function(dataPoint, callback) {
          callback(
            null,
            {
              fantasyVal: dataPoint.fantasy_value,
              timeVal: dataPoint[TIMEFIELD].getTime()
            });
        },
        callback);
    },
    function(dataPoints, callback) {
      dataPoints.reverse();
      callback(null, dataPoints);
    }
  ],
  callback);
}

/**
 * @param  {array}   athleteIds
 * @param  {int}   timeAgo
 * milliseconds to look in the past
 * @param  {Function} callback
 * args: (err, result)
 */
function getMultipleByAthleteId(athleteIds, timeAgo, callback) {
  async.map(athleteIds, function(id, callback) {
    getByAthleteId(id, timeAgo, callback);
  }, callback);
}

function getCachedByAthleteId(athleteId) {
  return contestAGlobals.timeseries[athleteId];
}

function getCachedByMultipleAthleteIds(athleteIds) {
  return athleteIds.map(function(id) {
    return contestAGlobals.timeseries[id];
  });
}

exports.getByAthleteId = getByAthleteId;
exports.getMultipleByAthleteId = getMultipleByAthleteId;
exports.getCachedByAthleteId = getCachedByAthleteId;
exports.getCachedByMultipleAthleteIds = getCachedByMultipleAthleteIds;