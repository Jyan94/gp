/**
 * ====================================================================
 * Author: Harrison Zhao
 * ====================================================================
 */
'use strict';
require('rootpath')();

var configs = require('config/index');
var SelectBets = require('libs/cassandra/contestA/select');
var positions = configs.constants.contestAbets.POSITIONS;

var async = require('async');

var contestAGlobals = configs.globals.contestA;

var OVER = positions.OVER;
var UNDER = positions.UNDER;

//formatted once loaded into array
function formatPendingBets(bets, callback) {
  async.map(bets, function(bet, callback){
    var retVal = {
      athleteId: bet.athlete_id,
      athleteName: bet.athlete_name,
      athleteTeam: bet.athlete_team,
      betId: bet.bet_id,
      fantasyValue: bet.fantasy_value,
      gameId: bet.game_id,
      overNotUnder: bet.is_selling_position[OVER],
      payoff: bet.payoff,
      sport: bet.sport
    };
    var sellingPosition;
    var takenPosition;
    if (retVal.overNotUnder) {
      sellingPosition = OVER;
      takenPosition = UNDER;
    }
    else {
      sellingPosition = UNDER;
      takenPosition = OVER;
    }
    retVal.bettor = bet.bettor_usernames[takenPosition];
    retVal.expiration = bet.expirations[sellingPosition].getTime();
    retVal.price = bet.prices[sellingPosition];
    callback(null, retVal);
  }, callback);
}

function hashPendingBetIds(bets, callback) {
  async.reduce(
    bets, 
    {
      betIdMap: {},
      count: 0
    }, 
    function(memo, bet, callback) {
      memo.betIdMap[bet.bet_id] = memo.count;
      ++memo.count;
      callback(null, memo);
    }, 
    function(err, result) {
      callback(err, result.betIdMap);
    });
}

function formatTakenBet(bet, overNotUnder) {
  var position;
  var otherPosition;
  if (overNotUnder) {
    position = OVER;
    otherPosition = UNDER;
  }
  else {
    position = UNDER;
    otherPosition = OVER;
  }

  return {
    athleteId: bet.athlete_id,
    athleteName: bet.athlete_name,
    athleteTeam: bet.athlete_team,
    betId: bet.bet_id,
    fantasyValue: bet.fantasy_value,
    gameId: bet.game_id,
    payoff: bet.payoff,

    opponent: bet.bettor_usernames[otherPosition],
    overNotUnder: overNotUnder,
    owner: bet.bettor_usernames[position],
    price: bet.old_prices[position],
    sport: bet.sport
  }
}

function formatResellBet(bet, overNotUnder) {
  var position;
  var otherPosition;
  if (overNotUnder) {
    position = OVER;
    otherPosition = UNDER;
  }
  else {
    position = UNDER;
    otherPosition = OVER;
  }

  return {
    athleteId: bet.athlete_id,
    athleteName: bet.athlete_name,
    athleteTeam: bet.athlete_team,
    betId: bet.bet_id,
    fantasyValue: bet.fantasy_value,
    gameId: bet.game_id,
    payoff: bet.payoff,

    expiration: bet.expirations[position],
    overNotUnder: overNotUnder,
    price: bet.prices[position],
    seller: bet.bettor_usernames[position],
    sport: bet.sport
  }
}

//will be applied on active bets
function formatResellAndTakenBets(bets, callback) {
  async.reduce(
    bets, 
    {
      taken: [], 
      resell: [], 
      overTakenIdToIndex: {}, 
      underTakenIdToIndex: {},
      overResellIdToIndex: {}, 
      underResellIdToIndex: {}, 
      takenCount: 0,
      resellCount: 0
    }, 
    function(memo, bet, callback) {
      if (bet.is_selling_position[OVER]) {
        memo.resell.push(formatResellBet(bet, true));
        memo.overResellIdToIndex[bet.bet_id] = memo.resellCount;
        ++memo.resellCount;
      }
      else {
        memo.taken.push(formatTakenBet(bet, true));
        memo.overTakenIdToIndex[bet.bet_id] = memo.takenCount;
        ++memo.takenCount;
      }
      if (bet.is_selling_position[UNDER]) {
        memo.resell.push(formatResellBet(bet, false));
        memo.overResellIdToIndex[bet.bet_id] = memo.resellCount;
        ++memo.resellCount;
      }    
      else {
        memo.taken.push(formatTakenBet(bet, false));
        memo.underTakenIdToIndex[bet.bet_id] = memo.takenCount;
        ++memo.takenCount;
      }
      callback(null, memo);
    }, 
    callback);
}

function loadPendingBets(callback) {
  async.waterfall(
  [
    function(callback) {
      SelectBets.selectPendingBets(callback);
    },
    function(bets, callback) {
      bets = bets || [];
      async.parallel(
      [
        function(callback) {
          formatPendingBets(bets, callback);
        },
        function(callback) {
          hashPendingBetIds(bets, callback);
        }
      ],
      function(err, results) {
        callback(err, results[0], results[1]);
      });
    }
  ],
  function(err, formattedPendingBets, pendingBetIdMap) {
    if (err) {
      callback(err);
    }
    else {
      contestAGlobals.pendingBets = formattedPendingBets;
      contestAGlobals.pendingBetIdToArrayIndex = pendingBetIdMap;
      callback(null);
    }
  });
}

function loadResellAndTakenBets(callback) {
  async.waterfall(
  [
    function(callback) {
      SelectBets.selectActiveBets(callback);
    },
    function(bets, callback) {
      bets = bets || [];
      formatResellAndTakenBets(bets, callback);
    }
  ],
  function(err, results) {
    if (err) {
      callback(err);
    }
    else {
      contestAGlobals.takenBets = results.taken;
      contestAGlobals.resellBets = results.resell;
      contestAGlobals.overResellBetIdToArrayIndex = 
        results.overResellIdToIndex;
      contestAGlobals.underResellBetIdToArrayIndex = 
        results.underResellIdToIndex;
      contestAGlobals.overTakenBetIdToArrayIndex = 
        results.overTakenIdToIndex;
      contestAGlobals.underTakenBetIdToArrayIndex = 
        results.underTakenIdToIndex;
      callback(null);
    }
  });
}

function loadAllBets(callback) {
  async.parallel(
  [
    loadPendingBets,
    loadResellAndTakenBets
  ], callback);
}

exports.loadAllBets = loadAllBets;