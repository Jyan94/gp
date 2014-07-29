/*global async*/

//pending hash is map of id: array index of betid in pending array
//resellHashes is broken up into over and under maps of id: array index
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
var POLL_INTERVAL = 2000;
var NUM_DISPLAYED = 50;

function customSetInterval(func, interval) {
  var callback = function (err) {
    if (err) {
      console.log(err);
    }
    setTimeout(function () {
      customSetInterval(func, interval);
    }, interval);
  };
  func(callback);
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

function fillHoles(holes, newHashes, newDisplayedBets) {
  var holesArr = Object.keys(holes);
  var emptySpotsToFill = NUM_DISPLAYED - holesArr.length;
  var totalLength = BetsWrapper.pending.length + BetsWrapper.resell.length;
  var candidateDisplayedBets = [];
  candidateDisplayedBets = BetsWrapper.pending;
  candidateDisplayedBets.push.apply(BetsWrapper.resell);
  shuffleArray(candidateDisplayedBets);
  var id;
  var j = 0;
  for (var i = 0; j !== holesArr.length || i !== totalLength; ++i) {
    id = candidateDisplayedBets[i].betId;
    if (!(newHashes.newPendingHash[id] || 
      newHashes.newOverResellHash[id] || 
      newHashes.newUnderResellHash[id])) {
      //add bet to display bet
      newDisplayedBets[holesArr[j]] = candidateDisplayedBets[i];
      //pending check
      if (candidateDisplayedBets[i].bettor) {
        newHashes.pending[id] = holesArr[j];
      }
      else if (candidateDisplayedBets[i].seller && 
               candidateDisplayedBets[i].overNotUnder) {
        newHashes.overResell[id] = holesArr[j];
      }
      else {
        newHashes.underResell[id] = holesArr[j];
      }
    }
  }
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
          if (BetsWrapper.pendingHash[id]) {
            memo.newPendingHash[id] = displayedBetsHashes.pending[id];
          }
          else {
            memo.holes[displayedBetsHashes.pending[id]] = true;
          }
        },
        callback);
    },
    function(callback) {
      async.reduce(
        Object.keys(displayedBetsHashes.overResell),
        {holes: {}, newOverResellHash: {}},
        function(memo, id, callback) {
          if (BetsWrapper.resellHashes.over[id]) {
            memo.newOverResellHash[id] = displayedBetsHashes.overResell[id];
          }
          else {
            memo.holes[displayedBetsHashes.overResell[id]] = true;
          }
        },
        callback);
    },
    function(callback) {
      async.reduce(
        Object.keys(displayedBetsHashes.underResell),
        {holes: {}, newUnderResellHash: {}},
        function(memo, id, callback) {
          if (BetsWrapper.resellHashes.over[id]) {
            memo.newUnderResellHash[id] = displayedBetsHashes.underResell[id];
          }
          else {
            memo.holes[displayedBetsHashes.underResell[id]] = true;
          }
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
    var holes = 
      $.extend({}, results[0].holes, results[1].holes, results[2].holes);
    fillHoles(holes, newDisplayedBetsHashes, newDisplayedBets);
    for (var i = 0; i !== newDisplayedBets.length; ++i) {
      if (!newDisplayedBets[i]) {
        newDisplayedBets[i] = displayedBets[i];
      }
    }
    displayedBetsHashes = newDisplayedBetsHashes;
    displayedBets = newDisplayedBets;
    console.log(displayedBetsHashes);
    console.log(displayedBets);
    callback(null);
  });
}

function requestGetAndUpdateBets(callback) {
  $.ajax({
    url: 'getbets',
    dataType: 'json',
    success: function(data) {
      updateBets(data, function(err) {
        if (err) {
          callback(err);
        }
        else {
          callback(null);
        }
      });
    },
    error: function(xhr, status, err) {
      console.error(xhr, status, err);
    }
  });
}

customSetInterval(requestGetAndUpdateBets, POLL_INTERVAL);

$(document).ready(function() {


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