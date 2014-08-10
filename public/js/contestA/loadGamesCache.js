/*
 * =============================================================================
 * Author: Harrison Zhao, Taehoon Lee
 * Date: 8/6/2014
 * Documentation:
 * must have jquery before this
 * include this file before any other non-jquery file to access athletes
 *
 * exports the object contestALoadGamesCache
 * which has methods:
 *   -getAthleteById
 *     args: (id)
 *     returns: athlete object
 *   -getAthletesArray
 *     returns: array of all athletes
 * =============================================================================
 */

/* global async */
'use strict';

(function(exports) {
  var gamesList = [];
  var gamesIdMap = {};
  var longTeamNameToGameMap = {};

  /**
   * returns an game object corresponding to given id
   * @param  {uuid} id
   * @return {object}    game object
   */
  function getGameById(id) {
    return gamesList[gamesIdMap[id]];
  }

  function getGameIdByLongTeamName (longTeamName) {
    return longTeamNameToGameMap[longTeamName];
  }

  function getGamesArray() {
    return gamesList;
  }

  function loadGamesFromServer(callback) {
    $.ajax({
      url: '/getTodaysGames',
      type: 'GET',

      //gets data from server
      //the data is a JSON stringified object
      //{
      //  gamesList: array of athlete objects,
      //  gamesIdMap: object keyed by gameed 
      //    and values index of game in array
      //}
      success: function(data) {
        data = JSON.parse(data);
        gamesList = data.gamesList;
        gamesIdMap = data.gamesIdMap;
        longTeamNameToGameMap = data.longTeamNameToGameMap;
        callback(null);
      },
      failure: function (response) {
        console.log(response);
        callback(new Error(response));
      },
      error: function(xhr, status, err) {
        console.error(xhr, status, err);
        callback(err);
      }
    });
  }

  exports.getGameById = getGameById;
  exports.getGameIdByLongTeamName = getGameIdByLongTeamName;
  exports.getGamesArray = getGamesArray;
  exports.loadGamesFromServer = loadGamesFromServer;
}(typeof exports === 'undefined' ? 
    window.contestALoadGamesCache = {} : 
    exports));