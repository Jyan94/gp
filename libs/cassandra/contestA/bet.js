'use strict';
(require('rootpath')());

var cassandra = require('libs/cassandra/cql');
var configs = require('config/index.js');
var async = require('async');
var cql = configs.cassandra.cql;
var multiline = require('multiline');
var one = cql.types.consistencies.one;
var states = configs.constants.contestAbets.STATES;
var OVER = configs.constants.contestAbets.POSITIONS.OVER;
var UNDER = configs.constants.contestAbets.POSITIONS.UNDER;
var MINUTES_IN_MILLISECONDS = configs.constants.globals.MINUTES_IN_MILLISECONDS;
var DEFAULT_USERNAME = configs.constants.contestAbets.DEFAULT_USERNAME;
var SEMICOLON = configs.constants.globals.SEMICOLON;

var PENDING = states.PENDING;
var ACTIVE = states.ACTIVE;
var PROCESSED = states.PROCESSED;
var EXPIRED = states.EXPIRED;

/*
cases: 
 your pending:
 name, fantasy value, payoff, over/under, wager
 your resell:
 name, fantasy value, payoff, over/under, opponent, purchased price
 your taken:
 name, fantasy value, payoff, over/under, opponent, purchased price
 pending market:
 name, fantasy value, wager, over/under, better
 secondary market:
 name, fantasy value, payoff, over/under, listed price, seller
 */

//test for pending - select all bets
function formatBet(bet, sellingOverNotUnder, mode) {
  var retVal = {
    athleteId: bet.athlete_id,
    athleteName: bet.athlete_name,
    athleteTeam: bet.athlete_team,
    betId: bet.bet_id,
    betState: bet.bet_state,
    fantasyValue: bet.fantasy_value,
    gameId: bet.gameId,
    payoff: bet.payoff,
    sport: bet.sport,
    sellingOverNotUnder: sellingOverNotUnder
  };

  var sellingPosition;
  var sellerPosition;
  if (sellingOverNotUnder) {
    sellingPosition = OVER;
  }
  else {
    sellingPosition = UNDER;
  }

  if ((bet.is_selling_position[OVER] && 
        bet.better_usernames[OVER] !== DEFAULT_USERNAME)||
      (bet.is_selling_position[UNDER] && 
        bet.better_usernames[UNDER] !== DEFAULT_USERNAME)) {
    retVal.isResell = true;
  }
  else {
    retVal.isResell = false;
  }
  //retVal.expiration = bet.expirations[position];
  //retVal.price = bet.prices[position];

  if (sellingOverNotUnder) {
    if (bet.is_selling_position[OVER]) {
      retVal.resellExpiration = bet.over_better_resell_expiration;
      retVal.resellValue = bet.over_better_resell_value;
      retVal.betterUsername = bet.better_usernames[OVER];
    }
    else {
      //opponent better
      retVal.betterUsername = bet.better_usernames[UNDER];
    }
  }
  else {
    if (bet.is_selling_position[UNDER]) {
      retVal.resellExpiration = bet.under_better_resell_expiration;
      retVal.resellValue = bet.under_better_resell_value;
      retVal.betterUsername = bet.better_usernames[UNDER];
    }
    else {
      retVal.betterUsername = bet.better_usernames[OVER];
    }
  }
  return retVal;
}

function formatBets(bets, callback) {
  if (!bets) {
    callback(null, null);
  }
  else if (bets instanceof Array) {
    async.reduce(bets, [], function(memo, bet, callback) {
      if (bet.is_selling_position[OVER]) {
        memo.push(formatBet(bet, true));
      }
      if (bet.is_selling_position[UNDER]) {
        memo.push(formatBet(bet, false));
      }
      callback(null, memo);
    }, callback);
  }
  else {
    callback(null, formatBet(bets));
  }
}

var SELECT_BET_BY_ID_CQL = multiline(function(){/*
  SELECT * FROM contest_A_bets WHERE bet_id = ?;
*/});

function selectByBetId(betId, callback) {
  cassandra.query(SELECT_BET_BY_ID_CQL, [betId], one, callback);
}

function createSelectByUsernameQuery(username) {
  return 
    'SELECT * FROM contest_A_bets WHERE better_usernames CONTAINS \'' +
    username +
    '\';';
} 

function selectByUsername(username, callback) {
  if(username.indexOf(SEMICOLON) === -1) {
    var query = createSelectByUsernameQuery(username);
    cassandra.query(query, [], one, callback);
  }
  else {
    callback(new Error('invalid username request'));
  }
}

var SELECT_SELLING_BETS_CQL = multiline(function(){/*
  SELECT * 
  FROM contest_A_bets 
  WHERE is_selling_position CONTAINS true;
*/});

function selectResellBets(callback) {
  cassandra.query(SELECT_SELLING_BETS_CQL, [], one, callback);
}

var SELECT_BETS_BY_STATE_CQL = multiline(function(){/*
  SELECT * 
  FROM contest_A_bets 
  WHERE bet_state = ?;
*/});

function selectBetsByState(state, callback) {
  cassandra.query(SELECT_BETS_BY_STATE_CQL, [state], one, callback);
}

function selectPendingBets(callback) {
  selectBetsByState(PENDING, callback);
}

function selectActiveBets(callback) {
  selectBetsByState(ACTIVE, callback);
}

function selectProcessedBets(callback) {
  selectBetsByState(PROCESSED, callback);
}

function selectExpiredBets(callback) {
  selectBetsByState(EXPIRED, callback);
}
/*
cases: 
 //PROFILE STUFF
 your pending:
 name, fantasy value, payoff, over/under, wager
 if (state === pending && username === username)
 your resell:
 name, fantasy value, payoff, over/under, purchased price, opponent
 if (state === active && isSellingPosition contains true && matches with username index)
 your taken:
 name, fantasy value, payoff, over/under, purchased price, opponent
 if (state === active && isSellingPosition contains false && matches with username index)

 //MARKET STUFF
 pending market:
 name, fantasy value, payoff, over/under, wager, better
 if (state === pending && username !== username)
 secondary market:
 name, fantasy value, payoff, over/under, listed price, seller
 if (state === active && isSellingPosition contains true && username !== username)
*/

function constructProfilePendingSelectCql(username) {
  return 
    'SELECT * FROM contest_a_bets WHERE bet_state = ? ' +
    'AND better_usernames CONTAINS \'' + 
    username +
    '\' ALLOW FILTERING;';
}
function selectProfilePending(username, callback) {
  var query = constructProfilePendingSelectCql(username);
  cassandra.query(query, [PENDING, true], one, callback);
}

function constructStateAndSellingQuery(state, bool) {
  return
    'SELECT * FROM contest_a_bets WHERE bet_state =' +
    state +
    ' AND' +
    'is_selling_position CONTAINS ' + 
    bool + 
    ' ALLOW FILTERING;';
}
function selectProfileResell(username, callback) {

  async.waterfall(
  [

    function(callback) {
      cassandra.query(
        constructStateAndSellingQuery(ACTIVE, true), 
        [], 
        one, 
        callback);
    },

    function(bets, callback) {
      async.filter(
        bets, 
        function(bet, callback) {
          callback(
            (bet.better_usernames[OVER] === username && 
             bet.is_selling_position[OVER]) ||
            (bet.better_usernames[UNDER] === username && 
             bet.is_selling_position[UNDER]));
        }, 
        callback);
    }

  ], callback);
}

function selectProfileTaken(username, callback) {
  async.waterfall(
  [
    function(callback) {
      cassandra.query(
        constructStateAndSellingQuery(ACTIVE, false), 
        [], 
        one, 
        callback);
    },
    function(bets, callback) {
      async.filter(
        bets, 
        function(bet, callback) {
          callback(
            (bet.better_usernames[OVER] === username && 
             !bet.is_selling_position[OVER]) ||
            (bet.better_usernames[UNDER] === username && 
             !bet.is_selling_position[UNDER]));
        }, 
        callback);
    }
  ], callback);
}

function selectPrimaryMarket(username, callback) {
  async.waterfall(
  [
    function(callback) {
      selectPendingBets(callback);
    },
    function(bets, callback) {
      async.filter(
        bets,
        function(bet, callback) {
          callback(
            bet.better_usernames[OVER] !== username && 
            bet.better_usernames[UNDER] !== username);
        }, callback);
    }
  ], callback);
}

function selectSecondaryMarket(username, callback) {
  async.waterfall(
  [
    function(callback) {
      cassandra.query(
        constructStateAndSellingQuery(ACTIVE, true),
        [],
        one,
        callback);
    },
    function(bets, callback) {
      async.filter(
        bets,
        function(bet, callback) {
          callback(
            bet.better_usernames[OVER] !== username && 
            bet.better_usernames[UNDER] !== username);
        }, callback);
    }
  ], callback);
}
