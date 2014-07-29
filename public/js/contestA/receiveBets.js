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
var changed = [];

function customSetInterval(func) {
  func();
  setTimeout(function() {
    customSetInterval(func);
  }, POLL_INTERVAL);
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

function updateData(holes, newHashes, newDisplayedBets) {
  var holesArr = Object.keys(holes);
  var emptySpotsToFill = NUM_DISPLAYED - holesArr.length;
  var totalLength = BetsWrapper.pending.length + BetsWrapper.resell.length;
  var candidateDisplayedBets = [];
  candidateDisplayedBets = BetsWrapper.pending;
  candidateDisplayedBets.push.apply(BetsWrapper.resell);
  shuffleArray(candidateDisplayedBets);
  var id;
  var i = 0;
  var j = 0;

  //fill in holes
  for (; j !== holesArr.length && i !== totalLength; ++i, ++j) {
    id = candidateDisplayedBets[i].betId;
    if (id &&
        !(newHashes.pending[id] || 
          newHashes.overResell[id] || 
          newHashes.underResell[id])) {
      //add bet to display bet
      var index = parseInt([holesArr[j]]);
      newDisplayedBets[index] = candidateDisplayedBets[i];
      changed[index] = index;

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
  }
  //end fill in holes

  //make sure already existing data stays the same
  for (i = 0; i !== displayedBets.length; ++i) {
    console.log(displayedBets.length);
    if (!newDisplayedBets[i]) {
      id = displayedBets[i].betId;
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

  //edge case: bets sent < number to be displayed
  if (newDisplayedBets.length < NUM_DISPLAYED) {
    for (
      i = 0; 
      i !== candidateDisplayedBets.length && 
        newDisplayedBets.length < NUM_DISPLAYED; 
      ++i) {

      id = candidateDisplayedBets[i].betId;
      if (id && 
          !(typeof(newHashes.pending[id]) !== 'undefined' || 
            typeof(newHashes.overResell[id]) !== 'undefined' || 
            typeof(newHashes.underResell[id]) !== 'undefined')) {

        changed[newDisplayedBets.length] = newDisplayedBets.length;
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
  console.log(changed);
  changed = [];
  async.each(changed, function(elem, callback) {
    if (elem || elem === 0) {
      //do isotope replace for given id
      console.log('hello ' + elem);
    }
  }, function(err) {

  });
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
    console.log(displayedBetsHashes);
    console.log('displayed Bets:');
    console.log(displayedBets);
    var newDisplayedBets = [];
    var holes = $.extend(
      {},
      results[0].holes,
      results[1].holes,
      results[2].holes);
    updateData(holes, newDisplayedBetsHashes, newDisplayedBets);
    displayedBetsHashes = newDisplayedBetsHashes;
    displayedBets = newDisplayedBets;
    console.log(displayedBetsHashes);
    console.log('displayed Bets: ');
    console.log(displayedBets);
  });
}

function requestGetAndUpdateBets() {
  $.ajax({
    url: 'getbets',
    dataType: 'json',
    success: function(data) {
      updateBets(data);
    },
    error: function(xhr, status, err) {
      console.error(xhr, status, err);
    }
  });
}
//setInterval(requestGetAndUpdateBets, POLL_INTERVAL);
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