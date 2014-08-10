/**
 * ====================================================================
 * Author: Harrison Zhao
 * ====================================================================
 */
'use strict';
(require('rootpath')());

var async = require('async');
var configs = require('config/index.js');
var ContestB = require('libs/cassandra/contestB/exports');
var VALID_SPORTS = configs.constants.validSports;
var BaseballPlayer = require('libs/cassandra/BaseballPlayer');

function selectGames(sport, gameIds, callback) {

}

function selectAndFilterAthletes(sport, athleteIds, callback) {
  var athleteContestIds = {};
  for (var i = 0; i !== athleteIds.length; ++i) {
    athleteContestIds[athleteIds[i]] = i;
  }
  var Athlete = null;
  switch(sport) {
    case 'Baseball': Athlete = BaseballPlayer; break;
  }
  var mapFunc = function(athleteId, callback) {
    Athlete.select(athleteId, function(err, result) {
      if (err) {
        callback(err);
      }
      else {
        callback(
          null,
          {
            athleteId: result.athlete_id,
            athleteName: result.full_name,
            athleteContestId: athleteContestIds[athleteId],
            position: result.position,
            shortTeamName: result.short_team_name,
            longTeamName: result.long_team_name,
            teamId: result.team_id
          });
      }
    });
  };
  async.map(athleteIds, mapFunc, callback);
}

function create(
  athleteIds,
  entryFee,
  gameIds,
  maximumEntries,
  minimumEntries,
  payOuts,
  sport,
  callback) {
  if (!VALID_SPORTS.hasOwnProperty(sport)) {
    callback(new Error('invalid sport'));
  }
  else {
    async.waterfall(
    [
      function(callback) {

      }
    ],
    function(err) {

    });
  }
}