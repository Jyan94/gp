'use strict';
require('rootpath')();

var async = require('async');
var configs = require('config/index');
var gamesCache = configs.globals.games;
var sportNames = configs.constants.sportNames;
var BASEBALL = sportNames.baseball;
var BASKETBALL = sportNames.basketball;
var FOOTBALL = sportNames.football;


function getGameBySportAndById(sport, id) {
  switch(sport) {
    case FOOTBALL:
      return gamesCache.footballList[gamesCache.footballIdMap[id]];
    case BASEBALL: 
      return gamesCache.baseballList[gamesCache.baseballIdMap[id]];
    case BASKETBALL:
      return gamesCache.basketballList[gamesCache.basketballIdMap[id]];
    default:
      return new Error('invalid sport');
  }
}

function getGameList(sport) {
  switch(sport) {
    case FOOTBALL:
      return gamesCache.footballList;
    case BASEBALL: 
      return gamesCache.baseballList;
    case BASKETBALL:
      return gamesCache.basketballList;
    default:
      return new Error('invalid sport');
  }
}

function getAllGamesList() {
  return gamesCache.allGamesList;
}

function getAllGamesIdMap() {
  return gamesCache.allGamesIdMap;
}

function getAllLongTeamNameToGameMap() {
  return gamesCache.longTeamNameToGameMap;
}

function getAllGamesJSON() {
  return configs.globals.allGamesCacheJSON;
}

function getGameById(id) {
  return gamesCache.allGamesList[gamesCache.allGamesIdMap[id]];
}

function getGameIdByLongTeamName(longTeamName) {
  return gamesCache.longTeamNameToGameMap[longTeamName];
}

exports.getGameBySportAndById = getGameBySportAndById;
exports.getGameById = getGameById;
exports.getGameList = getGameList;
exports.getAllGamesList = getAllGamesList;
exports.getAllGamesJSON = getAllGamesJSON;
exports.getGameIdByLongTeamName = getGameIdByLongTeamName;