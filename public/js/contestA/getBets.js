/*
 * =============================================================================
 * Author: Harrison Zhao
 * Date: 7/27/2014
 * =============================================================================
 */
/*global async*/
/*global contestACreateAthleteCard*/
'use strict';
/*
 * =============================================================================
 * READ ME!!!!
 * make sure athlete cards are sortable by id class
 * each bet has an id corresponding to its index in displayedBets
 * must include async and createAthleteCard before this file
 * ASSUMES THE IDs for cards are of the form [string]-[array index]
 *
 * $container.isotope({
    getSortData: {
      id: '.id'
    }
   });
 * =============================================================================
 */

(function(exports) {
  /*
   * ===========================================================================
   * Globals for manipulating isotope div
   * ===========================================================================
   */
  //isotope div
  var $container;
  //request url
  var getBetUrl = 'getbets';
  var DELIM = '-';

  //TODO: should make following lists not global
  //list of isotope elements
  var elementList = [];
  //lists for insertion and removal for isotope
  var insertList = [];
  var removeList = [];
  var nullList = [];

  /*
   * ===========================================================================
   * Globals for displaying bets
   *
   * BetsWrapper: raw data retrieved from server
   * pending: array of bets
   * pendingHash: map of id to array index
   * resell: array of bets
   * resellHash: map of id to array index
   *
   * displayedBets: array of ordered bets currently displayed
   * displayedBetsHash: maps of id to array index based on bet state
   *
   * POLL_INTERVAL: number of milliseconds between polls
   * NUM_DISPLAYED: max number of bets displayed
   * ===========================================================================
   */
  var BetsWrapper = {
    pending: [],
    pendingHash: {},
    resell: [],
    resellHashes: {}
  };

  //array of bets
  var displayedBets = [];
  //map of betId to index
  var displayedBetsHashes = {
    pending: {},
    overResell: {},
    underResell: {}
  };
  var POLL_INTERVAL = 1000;
  var NUM_DISPLAYED = 5;

  /*
   * ===========================================================================
   */

  //pending hash is map of id: array index of betid in pending array
  //resellHashes is broken up into over and under maps of id: array index
  /*
   * ===========================================================================
   * For updating bets
   * ===========================================================================
   */
  //replace with linear time sort or async sort in future
  function sortElementList() {
    var i, j, tmp;
    for (i = 1; i !== elementList.length; ++i) {
      j = i;
      while (j > 0 && getElementId(j-1) > getElementId(j)) {
        tmp = elementList[j-1];
        elementList[j-1] = elementList[j];
        elementList[j] = tmp;
      }
    }
  }

  function getElementId(index) {
    return parseInt(
      elementList[index]
      .getAttribute('id')
      .substring(
        elementList[index]
        .getAttribute('id')
        .indexOf(DELIM) + 1));
  }

  function checkIfElementListSorted() {
    for (var i = 1; i < elementList.length; ++i) {
      if (getElementId(i) < getElementId(i - 1)) {
        return false;
      }
    }
    return true;
  }

  function checkAndSortElementList(callback) {
    if (!checkIfElementListSorted()) {
      setTimeout(function() {
        sortElementList();
        checkAndSortElementList(callback);
      }, 100);
    }
    else {
      callback();
    }
  }

  //fisher-yates shuffle
  function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
    return array;
  }

  //can optimize to make it async waterfall-able
  /**
   * updates the cards
   * @param  {object} holes
   * map of index to bool (TODO: change it to just an array)
   * @param  {object} newHashes
   * object containing objects which map id to index
   * @param  {array} newDisplayedBets
   * array to hold new bets to be displayed
   * @return {object}
   * returns the newHashes object and newDisplayedBets object
   */
  function updateData(holes, newHashes, newDisplayedBets, callback) {
    var holesArr = Object.keys(holes);
    var totalLength = BetsWrapper.pending.length + BetsWrapper.resell.length;
    var candidateDisplayedBets = [];
    candidateDisplayedBets = BetsWrapper.pending;
    candidateDisplayedBets.push.apply(BetsWrapper.resell);
    shuffleArray(candidateDisplayedBets);
    var id;
    var i = 0;
    var j = 0;
    var index;

    //fill in holes
    for (; j !== holesArr.length; ++j) {
      //keep i from before
      for (; i !== totalLength; ++i) {
        id = candidateDisplayedBets[i] ? candidateDisplayedBets[i].betId : null;
        if (
          id &&
          (typeof(newHashes.pending[id]) === 'undefined' &&
          typeof(newHashes.overResell[id]) === 'undefined' &&
          typeof(newHashes.underResell[id]) === 'undefined')) {

          index = parseInt([holesArr[j]]);
          newDisplayedBets[index] = candidateDisplayedBets[i];
          if (candidateDisplayedBets[i].bettor) {
            newHashes.pending[id] = index;
          }
          else if (candidateDisplayedBets[i].seller &&
                   candidateDisplayedBets[i].overNotUnder) {
            newHashes.overResell[id] = index;
          }
          else {
            newHashes.underResell[id] = index;
          }
          ++i;
          break;
        }
      }
    }

    //make sure already existing data stays the same
    for (i = 0; i !== displayedBets.length; ++i) {
      id = displayedBets[i].betId;
      if (
        !newDisplayedBets[i] &&
        (typeof(newHashes.pending[id]) !== 'undefined' ||
        typeof(newHashes.overResell[id]) !== 'undefined' ||
        typeof(newHashes.underResell[id]) !== 'undefined')) {

        newDisplayedBets[i] = displayedBets[i];
        if (displayedBets[i].bettor) {
          newHashes.pending[id] = i;
        }
        else if (displayedBets[i].seller &&
                 displayedBets[i].overNotUnder) {
          newHashes.overResell[id] = i;
        }
        else {
          newHashes.underResell[id] = i;
        }
      }
    }
    //check if there's any unfilled holes and compress array
    //reassign indicies
    newDisplayedBets = newDisplayedBets.filter(function(bet) {
      return typeof(bet) !== 'undefined';
    })
    var hashes = {
      pending: {},
      overResell: {},
      underResell: {}
    }
    for (i = 0; i !== newDisplayedBets.length; ++i) {
      if (newDisplayedBets[i].bettor) {
        hashes.pending[newDisplayedBets[i].betId] = i;
      }
      else if (newDisplayedBets[i].seller &&
               newDisplayedBets[i].overNotUnder) {
        hashes.overResell[newDisplayedBets[i].betId] = i;
      }
      else {
        hashes.underResell[newDisplayedBets[i].betId] = i;
      }
    }
    newHashes.pending = hashes.pending;
    newHashes.overResell = hashes.overResell;
    newHashes.underResell = hashes.underResell;
    //done reassigning

    //edge case: bets sent < number to be displayed
    if (newDisplayedBets.length < NUM_DISPLAYED) {
      for (
        i = 0;
        i !== candidateDisplayedBets.length &&
          newDisplayedBets.length < NUM_DISPLAYED;
        ++i) {

        id = candidateDisplayedBets[i] ? candidateDisplayedBets[i].betId : null;
        //if none of them exist, and id exists continue
        if (
          id &&
          typeof(newHashes.pending[id]) === 'undefined' &&
          typeof(newHashes.overResell[id]) === 'undefined' &&
          typeof(newHashes.underResell[id]) === 'undefined') {

          if (candidateDisplayedBets[i].bettor) {
            newHashes.pending[id] = newDisplayedBets.length;
          }
          else if (candidateDisplayedBets[i].seller &&
                   candidateDisplayedBets[i].overNotUnder) {
            newHashes.overResell[id] = newDisplayedBets.length;
          }
          else {
            newHashes.underResell[id] = newDisplayedBets.length;
          }
          newDisplayedBets[newDisplayedBets.length] = candidateDisplayedBets[i];
        }
      }
    }
    //end edge case

    //get changed
    //check against old one
    //or index changed
    var changed = [];
    for (i = 0; i !== newDisplayedBets.length; ++i) {
      id = newDisplayedBets[i].betId;
      if (
        (typeof(displayedBetsHashes.pending[id]) !== 'undefined' &&
         newHashes.pending[id] !== displayedBetsHashes.pending[id]) ||

        (typeof(displayedBetsHashes.overResell[id]) !== 'undefined' &&
         newHashes.overResell[id] !== displayedBetsHashes.overResell[id]) ||

        (typeof(displayedBetsHashes.underResell[id]) !== 'undefined' &&
         newHashes.underResell[id] !== displayedBetsHashes.underResell[id]) ||

        (typeof(displayedBetsHashes.pending[id]) === 'undefined' &&
        typeof(displayedBetsHashes.overResell[id]) === 'undefined' &&
        typeof(displayedBetsHashes.underResell[id]) === 'undefined')

        ) {

        changed.push(i);
      }
    }

    elementList = $container.data('isotope').getItemElements();
    //sortElementList();
    function updateCallback() {
      insertList = [];
      removeList = [];
      //get extra changed
      for (i = 0; i !== changed.length; ++i) {
        removeList.push(changed[i]);
        insertList.push(changed[i]);
      }
      for (i = newDisplayedBets.length; i < displayedBets.length; ++i) {
        removeList.push(i);
        nullList.push(i);
      }
      for (i = 0; i !== removeList.length; ++i) {
        $container.data('isotope').remove(elementList[removeList[i]]);
      }
      for (i = 0; i !== insertList.length; ++i) {
        $container.data('isotope').insert(
          contestACreateAthleteCard.createCard(
            insertList[i], newDisplayedBets[insertList[i]]));
      }
      for (i = 0; i !== nullList.length; ++i) {
        $container.data('isotope').insert(
          contestACreateAthleteCard.createCard(nullList[i], null));
      }
      $container.isotope({ sortBy : 'id' });
      displayedBetsHashes = newHashes;
      displayedBets = newDisplayedBets;
      callback();
    }
    checkAndSortElementList(updateCallback);
  }

  /*
  map keys, find out which displayedBets indicies need replacing
  find number of indicies need replacing (array)
  get a number of bets from new data (array)
  replace it and update the map
   */
  function updateBets(data, callback) {
    BetsWrapper = data;
    async.parallel(
    [
      function(callback) {
        async.reduce(
          Object.keys(displayedBetsHashes.pending),
          {holes: {}, newPendingHash: {}},
          function(memo, id, callback) {
            if (typeof(BetsWrapper.pendingHash[id]) === 'undefined') {
              memo.holes[displayedBetsHashes.pending[id]] = true;
            }
            else {
              memo.newPendingHash[id] = displayedBetsHashes.pending[id];
            }
            callback(null, memo);
          },
          callback);
      },
      function(callback) {
        async.reduce(
          Object.keys(displayedBetsHashes.overResell),
          {holes: {}, newOverResellHash: {}},
          function(memo, id, callback) {
            if (typeof(BetsWrapper.resellHashes.over[id]) === 'undefined') {
              memo.holes[displayedBetsHashes.overResell[id]] = true;
            }
            else {
               memo.newOverResellHash[id] = displayedBetsHashes.overResell[id];
            }
            callback(null, memo);
          },
          callback);
      },
      function(callback) {
        async.reduce(
          Object.keys(displayedBetsHashes.underResell),
          {holes: {}, newUnderResellHash: {}},
          function(memo, id, callback) {

            if (typeof(BetsWrapper.resellHashes.under[id]) === 'undefined') {
              memo.holes[displayedBetsHashes.underResell[id]] = true;
            }
            else {
              memo.newUnderResellHash[id] = displayedBetsHashes.underResell[id];
            }
            callback(null, memo);
          },
          callback);
      }
    ],
    function(err, results) {
      var newDisplayedBetsHashes = {
        pending: results[0].newPendingHash,
        overResell: results[1].newOverResellHash,
        underResell: results[2].newUnderResellHash
      };
      var newDisplayedBets = [];
      var holes = $.extend(
        {},
        results[0].holes,
        results[1].holes,
        results[2].holes);
      updateData(holes, newDisplayedBetsHashes, newDisplayedBets, callback);
      //var retval = updateData(holes, newDisplayedBetsHashes, newDisplayedBets);
      //displayedBetsHashes = retval.newDisplayedBetsHashes;
      //displayedBets = retval.newDisplayedBets;
      //callback();
    });
  }

  /**
   * exported
   * makes an ajax request to server for bets
   */
  function requestGetAndUpdateBets() {
    //add delay to this if card flipped over
    if ($('.flipped').length === 0) {
      $.ajax({
        url: getBetUrl,
        dataType: 'json',
        success: function(data) {
            updateBets(data, function() {
              setTimeout(requestGetAndUpdateBets, POLL_INTERVAL);
            });
        },
        error: function(xhr, status, err) {
          console.error(xhr, status, err);
        }
      });
    }
    else {
      setTimeout(requestGetAndUpdateBets, POLL_INTERVAL);
    }
  }

  /**
   * exported
   * gets a bet's information given the id,
   * which is the index of the bet in array
   * @param  {int} id
   */
  function getBetByIndex(id) {
    return displayedBets[id];
  }

  /**
   * exported function, must be called to initialize isotope container
   * @param {jquery object} container
   * returns what was accepted as an argument
   */
  function setIsotopeContainer(container) {
    $container = container;
    return $container;
  }

  /*
   * ===========================================================================
   * EXPORTS BELOW
   * ===========================================================================
   */
  exports.requestGetAndUpdateBets = requestGetAndUpdateBets;
  exports.getBetByIndex = getBetByIndex;
  exports.setIsotopeContainer = setIsotopeContainer;

  /*
   * ===========================================================================
   * MUST HAVE SOMETHING OF THE SORT IN FILE THAT UTILIZES THIS FILE:
   * ===========================================================================
   */
  /*$(document).ready(function() {
    $container = contestARetrieveBet.setIsotopeContainer($('.isotope'));
    $container.isotope({
      itemSelector: '.playercard1',
      layoutMode: 'fitRows',
      getSortData: {
        id: '.id'
      }
    });
    contestARetrieveBet.requestGetAndUpdateBets();
  });*/

}(typeof exports === 'undefined' ? window.contestAGetBets = {} : exports));

