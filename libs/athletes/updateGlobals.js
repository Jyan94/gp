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

//update other sports too
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
      callback(null);
    }
  });
}
exports.updateAthletes = updateAthletes;