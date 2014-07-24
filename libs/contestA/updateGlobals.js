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
var pendingBets = contestAGlobals.pendingBets;
var resellBets = contestAGlobals.resellBets;
var takenBets = contestAGlobals.takenBets;
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
      payoff: bet.payoff
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
    price: bet.old_prices[position]
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
    seller: bet.bettor_usernames[position] 
  }
}

//will be applied on active bets
function formatResellAndTakenBets(bets, callback) {
  async.reduce(bets, {taken: [], resell: []}, function(memo, bet, callback) {
    if (bet.is_selling_position[OVER]) {
      memo.resell.push(formatTakenBet(bet, true));
    }
    else {
      memo.taken.push(formatResellBet(bet, true));
    }
    if (bet.is_selling_position[UNDER]) {
      memo.resell.push(formatTakenBet(bet, false));
    }    
    else {
      memo.taken.push(formatResellBet(bet, false));
    }
    callback(null, memo);
  }, callback);
}

function loadPendingBets(callback) {
  async.waterfall(
  [
    function(callback) {
      SelectBets.selectPendingBets(callback);
    },
    function(bets, callback) {
      formatPendingBets(bets, callback);
    }
  ],
  function(err, results) {
    if (err) {
      callback(err);
    }
    else {
      pendingBets = results;
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
      formatResellAndTakenBets(bets, callback);
    }
  ],
  function(err, results) {
    if (err) {
      callback(err);
    }
    else {
      takenBets = results.taken;
      resellBets = results.resell;
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