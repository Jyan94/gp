/**
 * ====================================================================
 * Author: Harrison Zhao
 * ====================================================================
 */
'use strict';
require('rootpath')();

var async = require('async');
var BaseballAthletes = require('libs/cassandra/baseball/player');
var configs = require('config/index');
var athletesCache = configs.globals.athletes;
var BASEBALL = configs.constants.sportNames;
var NUM_STATISTICS_CACHED = configs.constants.NUM_STATISTICS_CACHED;

function formatAthlete(athlete, callback) {
  var retval = {
    age: athlete.age,
    id: athlete.athlete_id,
    firstName: athlete.first_name,
    fullName: athlete.full_name,
    height: athlete.height,
    image: athlete.image_url,
    lastName: athlete.last_name,
    longTeamName: athlete.long_team_name,
    position: athlete.position,
    shortTeamName: athlete.short_team_name,
    sport: BASEBALL,
    status: athlete.status,
    teamId: athlete.teamId,
    uniformNumber: athlete.uniform_number,
    weight: athlete.weight 
  };
  async.waterfall(
  [
    function(callback) {
      athlete.statistics = athlete.statistics || {};
      async.map(
        Object.keys(athlete.statistics), 
        function(gameId, callback) {
          callback(null, JSON.parse(athlete.statistics[gameId]));
        }, 
        callback);  
    },
    function(statistics, callback) {
      async.sortBy(
        statistics, 
        function(stat, callback) {
          callback(null, stat.gameDate);
        }, 
        function(err, results) {
          retval.statistics = results.slice(-NUM_STATISTICS_CACHED);
          callback(null);
        });
    }
  ],
  function(err) {
    callback(retval);
  });
}

//callback args: (err)
function update(callback) {
  async.waterfall(
  [
    function(callback) {
      BaseballAthletes.selectAll(callback);
    },
    function(athletes, callback) {
      async.map(
        athletes, 
        function(athlete, callback) {
          formatAthlete(athlete, function(result) {
            callback(null, result);
          });
        },
        callback);
    },
    function(formattedAthletes, callback) {
      athletesCache.baseballList = formattedAthletes;
      async.reduce(
        formattedAthletes, 
        {idMap: {}, index: 0}, 
        function(memo, athlete, callback) {
          memo.idMap[athlete.id] = memo.index;
          ++memo.index;
          callback(null, memo)
        }, 
        function(err, result) {
          athletesCache.baseballIdMap = result.idMap;
          callback(null);
        });
    }
  ],
  callback);
}

exports.update = update;