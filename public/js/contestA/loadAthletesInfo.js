/*
 * =============================================================================
 * Author: Harrison Zhao
 * Date: 8/1/2014
 * Documentation:
 * must have jquery before this
 * include this file before any other non-jquery file to access athletes
 *
 * exports the object contestALoadAthletes
 * which has methods:
 *   -getAthleteById
 *     args: (id)
 *     returns: athlete object
 *   -getAthletesArray
 *     returns: array of all athletes
 * =============================================================================
 */
//must have jquery before this
//include this file before any other non-jquery file
'use strict';

(function() {
  var athletesList = [];
  var athletesIdMap = {};

  function getAthleteById(id) {
    return athletesList[athletesIdMap[id]];
  }

  function getAthletesArray() {
    return athletesList;
  }

  function loadAthletesFromServer() {
    $.ajax({
      url: '/initialAthletesLoad',
      type: 'GET',

      //accepts an array with elements that have fields:
      //'dateOf(time)' and price
      success: function(data) {
        athletesList = data.athletesList;
        athletesIdMap = data.athletesIdMap;
      },
      error: function(xhr, status, err) {
        console.error(xhr, status, err);
      }
    });
  }
  
  exports.getAthleteById = getAthleteById;
  exports.getAthletesArray = getAthletesArray;
}(typeof exports === 'undefined' ? 
    window.contestALoadAthletes = {} : 
    exports));