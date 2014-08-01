/*
 * =============================================================================
 * Author: Harrison Zhao
 * Date: 7/27/2014
 * =============================================================================
 */
/*global async*/
'use strict';

/*
 * =============================================================================
 * Globals for manipulating isotope div
 * =============================================================================
 */
//isotope div
var $container;
var elementList = [];
var insertList = [];
var removeList = [];
var nullList = [];

function createAthleteCard(
  arrayId,
  fantasyValue,
  fullName,  
  fullTeamName,
  overNotUnder,
  pictureUrl,
  athletePosition,
  wager) {

  var betPosition;
  if (overNotUnder) {
    betPosition = 'over';
  }
  else {
    betPosition = 'under';
  }
  var retval = $(
    '<div id=' + arrayId + ' class=\'playercard1\'>' +
    '<div class="id" style="display:">' + arrayId + '</div>' +
    '<div class=\'playercard1-playerpic\'>' + 
    '<img width=\'250\' height=\'250\' src=\'' + pictureUrl + '\'>' +

    '<div class=\'playercard1-info\'>' +

      '<div class=\'playercard1-info name\'>' +
      '<center>' +
      '<p>' + fullName + '</p>' +
      '</center>' +
      '</div>' +

      '<div class=\'playercard1-info pos\'>' +
      '<center>' +
      '<p>' + athletePosition + '|' + fullName +'</p>' +
      '</center>' +
      '</div>' +

    '</div>' +

    '<div class=\'playercard1-bottom\'>' +

      '<div class=\'playercard1-bottom wager\'>' +
      '<p> $' + wager + " " + betPosition + " " + fantasyValue + "FP</p>" +
      '</div>' +

      '<div class=\'playercard1-bottom submit\'>' +
        '<center>' +
        '<div class=\'pure-button button-primary\'>Take</div>' +
        '</center>' +
      '</div>' +

    '</div>' +

    '</div>' +
    '</div>');
  return retval;
}

function createCardAndReplace(index, bet) {
  var div = $('#' + index);
  var card;
  if (bet) {
    card = createAthleteCard(
      index,
      bet.fantasyValue,
      bet.athleteName,
      bet.athleteTeam,
      bet.overNotUnder,
      'http://i.huffpost.com/gen/1582890/thumbs/o-CARMELO-ANTHONY-facebook.jpg',
      bet.athletePosition,
      bet.price);
  }
  else {
    card = '<div id=' + index + ' style="display: none;">'
  }
  return card;
}

function createHiddenDiv(index) {
  var newDiv = document.createElement('div');
  newDiv.style.display = 'none';
  newDiv.id = index;
  return newDiv;
}

//end globals for isotope stuff

//pending hash is map of id: array index of betid in pending array
//resellHashes is broken up into over and under maps of id: array index
/*
 * =============================================================================
 * Globals for updating bets
 * =============================================================================
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
var POLL_INTERVAL = 10000;
var NUM_DISPLAYED = 5;

function radixElementList() {
  elementList.sort(function(a, b) {
    return a.getAttribute('id') > b.getAttribute('id');
  });
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
function updateData(holes, newHashes, newDisplayedBets) {
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
      id = candidateDisplayedBets[i].betId;
      if (typeof(newHashes.pending[id]) === 'undefined' &&
          typeof(newHashes.overResell[id]) === 'undefined' && 
          typeof(newHashes.underResell[id]) === 'undefined') {

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
  /*
  for (; j !== holesArr.length && i !== totalLength; ++i, ++j) {
    id = candidateDisplayedBets[i].betId;
    if (
      id &&
      typeof(newHashes.pending[id]) === 'undefined' &&
      typeof(newHashes.overResell[id]) === 'undefined' && 
      typeof(newHashes.underResell[id]) === 'undefined') {

      //add bet to display bet
      index = parseInt([holesArr[j]]);
      newDisplayedBets[index] = candidateDisplayedBets[i];
      console.log('hi');
      console.log(index);
      //pending check
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
    }
  }*/
  //end fill in holes
  /*
  for (i = 0; i !== newDisplayedBets.length; ++i) {
    console.log('**');
    console.log('index: ' + i);
    console.log(newDisplayedBets[i].betId);
    console.log(newHashes.pending[newDisplayedBets[i].betId]);
    console.log('**');
  }*/
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
  /*
  for (i = 0; i !== newDisplayedBets.length; ++i) {
    console.log('**');
    console.log('index: ' + i);
    console.log(newDisplayedBets[i].betId);
    console.log(newHashes.pending[newDisplayedBets[i].betId]);
    console.log('**');
  }*/

  //edge case: bets sent < number to be displayed
  if (newDisplayedBets.length < NUM_DISPLAYED) {
    for (
      i = 0; 
      i !== candidateDisplayedBets.length && 
        newDisplayedBets.length < NUM_DISPLAYED; 
      ++i) {

      id = candidateDisplayedBets[i].betId;
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
      //console.log('//')
      //console.log(id);
      //console.log(newHashes.pending[id])
      //console.log(displayedBetsHashes.pending[id]);
      //console.log('\\\\');
      changed.push(i);
    }
  }

  /*for (i = 0; i !== newDisplayedBets.length; ++i) {
    if (i !== changed[0] && 
      newHashes.pending[newDisplayedBets[i].betId] 
      !== displayedBetsHashes.pending[newDisplayedBets[i].betId]) {
      console.log(newDisplayedBets[i].betId);
      console.log(newHashes.pending[newDisplayedBets[i].betId] );
      console.log(displayedBetsHashes.pending[newDisplayedBets[i].betId]);
      console.log('fuck!');
    }
  }*/
  /*
  console.log(newDisplayedBets.map(function(x) {
    return x.betId;
  }));
  console.log(displayedBets.map(function(x) {
    return x.betId;
  }));
  console.log(newHashes.pending);
  console.log(displayedBetsHashes.pending);
  */
  elementList = $container.data('isotope').getItemElements();
  radixElementList();
  insertList = [];
  removeList = [];
  //get extra changed
  /*for (i = 0; i !== changed.length; ++i) {
    createCardAndReplace(changed[i], newDisplayedBets[changed[i]]);
  }
  for (i = newDisplayedBets.length; i < currentLength; ++i) {
    createCardAndReplace(i, null);
  }*/
  for (i = 0; i !== changed.length; ++i) {
    removeList.push(changed[i]);
    insertList.push(changed[i]);
  }
  for (i = newDisplayedBets.length; i < displayedBets.length; ++i) {
    removeList.push(i);
    nullList.push(i);
  }/*
  console.log(removeList);
  console.log(insertList);
  console.log(removeList);
  console.log(elementList.map(function(x) {return x.getAttribute('id');}));*/
  for (i = 0; i !== removeList.length; ++i) {
    $container.data('isotope').remove(elementList[removeList[i]]);
  }
  for (i = 0; i !== insertList.length; ++i) {
    $container.data('isotope').insert(
      createCardAndReplace(insertList[i], newDisplayedBets[insertList[i]]));
  }
  for (i = 0; i !== nullList.length; ++i) {
    $container.data('isotope').insert(
      createCardAndReplace(nullList[i], null));
  }
  $container.isotope({ sortBy : 'id' });
  //$container.data('isotope').layout();
  return {
    newDisplayedBetsHashes: newHashes,
    newDisplayedBets: newDisplayedBets
  };
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
    var retval = updateData(holes, newDisplayedBetsHashes, newDisplayedBets);
    displayedBetsHashes = retval.newDisplayedBetsHashes;
    displayedBets = retval.newDisplayedBets;
    //console.log(displayedBets);
    //console.log(displayedBetsHashes);
    callback();
  });
}

function requestGetAndUpdateBets() {
  $.ajax({
    url: 'getbets',
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

/*
 * =============================================================================
 * End Update Bet Globals
 * =============================================================================
 */

$(document).ready(function() {

  $container = $('.isotope');
  var sequenceArr = [];
  for (var i = 0; i < NUM_DISPLAYED; ++i) {
    $container[0].appendChild(createHiddenDiv(i));
  }
  $container.isotope({
    itemSelector: '.playercard1',
    layoutMode: 'fitRows',
    getSortData: {
      id: '.id'
    }
  });
  requestGetAndUpdateBets();

  /**
   * data
   * @param  {object} data
   * data from the server for bets and hashmap of betId to array index
   */
  //displayed bets: array
  //displayedBetsHash: map of id to array index
  //pending: array of bets
  //pendingHash: map of id to array index
  //resell: array of bets
  //resellHash: map of id to array index
  //
  //see which betIds are removed 
  //(iterate through array of displayed and check ids)
  //get those array indexes that need replacing
  //select distribution of random to fill in from pending and resell
  //make sure that those don't already exist
  //Obj.keys
  //
  //


});