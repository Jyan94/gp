/**
 * ====================================================================
 * Author: Harrison Zhao
 * ====================================================================
 */
'use strict';
require('rootpath')();

var async = require('async');
var configs = require('config/index');
var athletesCache = configs.globals.athletes;
var athletesCacheJSON = configs.globals.athletesJSON;
var sportNames = configs.constants.sportNames;
var BASEBALL = sportNames.baseball;
var BASKETBALL = sportNames.basketball;
var FOOTBALL = sportNames.football;


function getAthleteBySportAndById(sport, id) {
  switch(sport) {
    case FOOTBALL:
      return athletesCache.footballList[athletesCache.footballIdMap[id]];
    case BASEBALL: 
      return athletesCache.baseballList[athletesCache.baseballIdMap[id]];
    case BASKETBALL:
      return athletesCache.basketballList[athletesCache.basketballIdMap[id]];
    default:
      return new Error('invalid sport');
  }
}

function getAthleteList(sport) {
  switch(sport) {
    case FOOTBALL:
      return athletesCache.footballList;
    case BASEBALL: 
      return athletesCache.baseballList;
    case BASKETBALL:
      return athletesCache.basketballList;
    default:
      return new Error('invalid sport');
  }
}

function getAllAthletesList() {
  return athletesCache.allAthletesList;
}

function getAllAthletesIdMap() {
  return athletesCache.allAthletesIdMap;
}

function getAllAthletesListJSON() {
  return athletesCacheJSON.allAthletesList;
}

function getAllAthletesIdMapJSON() {
  return athletesCacheJSON.allAthletesIdMap;
}

exports.getAthleteBySportAndById = getAthleteBySportAndById;
exports.getAthleteList = getAthleteList;
exports.getAllAthletesList = getAllAthletesList;
exports.getAllAthletesListJSON = getAllAthletesListJSON;
exports.getAllAthletesIdMapJSON = getAllAthletesIdMapJSON;