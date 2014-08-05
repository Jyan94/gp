/**
 * ====================================================================
 * Author: Harrison Zhao
 * ====================================================================
 */
'use strict';
require('rootpath')();

var async = require('async');
var configs = require('config/index');
var updateBaseballAthletes = require('libs/athletes/baseball');
var athletesCache = configs.globals.athletes;

//TODO: update other sports too
function updateAthletes(callback) {
  async.parallel(
  [
    function(callback) {
      updateBaseballAthletes.update(callback);
    }
    //add other sports
  ],
  function(err) {
    if (err) {
      callback(err);
    }
    else {
      athletesCache.allAthletesList = [].concat(
        athletesCache.footballList,
        athletesCache.baseballList,
        athletesCache.basketballList);

      async.reduce(
        athletesCache.allAthletesList,
        {
          index: 0,
          retVal: {}
        },
        function(memo, athleteObj, callback) {
          memo.retVal[athleteObj.id] = memo.index;
          ++memo.index;
          callback(null, memo);
        },
        function(err, result) {
          if (err) {
            callback(err);
          }
          else {
            athletesCache.allAthletesIdMap = result.retVal;
            configs.globals.allAthletesCacheJSON = JSON.stringify({
              athletesList: athletesCache.allAthletesList,
              athletesIdMap: result.retVal
            });
            callback(null);
          }
        });

    }
  });
}
exports.updateAthletes = updateAthletes;