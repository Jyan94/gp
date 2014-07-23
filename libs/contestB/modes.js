/**
 * ====================================================================
 * Author: Harrison Zhao
 * ====================================================================
 */
'use strict';
(require('rootpath')());
var async = require('async');
var configs = require('config/index.js');
var cql = configs.cassandra.cql;
var contestB = require('libs/cassandra/contestB/exports');

/**
 * returns a settings array for database query insertion of contests
 * entries is for contest_count_entries table
 * mode is for contest_B table
 *
 * @param  {array} athleteNames
 *         list of strings for athlete names
 * @param  {Object} athletes
 *         map of an int, as string, 0-x number of athletes to athlete type
 *         stringified values of objects for each key-value pair
 * @parame {int} commissionEarned
 *         determined after sport event ends and payouts are calculated
 * @param  {Date} deadlineTime
 *         date of contest deadline
 * @param  {int} cooldownMinutes
 *         time in minutes before one can re-edit their entry
 * @param  {int} entriesAllowedPerContestant
 *         maximum entries allowed for a given contestant
 * @param  {Date} deadlineTime
 *         time when both no additional players can join and bets are locked in
 * @param  {int} entryFee
 * @param  {text} games
 *         list of game uuids
 * @param  {boolean} isfiftyfifty
 *         if it's a fifty-fifty game mode where half of the entrants win
 * @param  {int} maxWager
 *         maximum wager on any given athlete
 * @param  {int} maximumEntries
 * @param  {int} minimumEntries
 * @param  {Object} payouts
 *         map of int, as string, rank to payout value 
 * @param  {string} sport
 * @param  {int} startingVirtualMoney
 *         initial virtual money for each player in contest
 * @param  {int} totalPrizePool
 *         total real money prize pool
 * @return {Array of arrays}
 *         Configuration array for initializing contest B
 */
function createSettings(
  athleteNames,
  athletes,
  deadlineTime,
  cooldownMinutes,
  entriesAllowedPerContestant,
  entryFee,
  games,
  isfiftyfifty,
  maxWager,
  maximumEntries,
  minimumEntries,
  payouts,
  sport,
  startingVirtualMoney,
  totalPrizePool) {

  return [
    athleteNames,
    athletes, //athletes
    0,  //commission_earned
    deadlineTime, //contest_deadline_time
    null, //contest_end_time
    cql.types.timeuuid(), //contest_id
    'Daily Prophet',  //contest_name
    new Date(), //contest_start_time
    0,  //contest_state
    {}, //contestants
    cooldownMinutes, //cooldown_minutes
    0,  //current_entries
    entriesAllowedPerContestant, //entries_allowed_per_contestant
    entryFee, //entry_fee
    games, //games
    isfiftyfifty, //isfiftyfifty
    maxWager, //max_wager
    maximumEntries, //maximum_entries
    minimumEntries, //minimum_entries
    payouts,  //pay_outs
    null, //processed_payouts_timestamp
    sport,  //sport
    startingVirtualMoney, //starting_virtual_money
    totalPrizePool  //total_prize_pool
  ];
}

/**
 * creates a contest parameters object that can be passed to the insert
 * function
 * @param  {array} athletes     
 * array
 * to JSON.stringify({athleteId: id, athleteName: name})
 * @param  {array} games
 * list of uuids for games
 * @param  {date} deadlineTime
 * deadline for users entering
 * @param  {string} sport       
 * @return {array}
 * parameters for contest_b insert query
 */
function createType1SettingsDeprecated(athletes, games, deadlineTime, sport) {
  var athletesObj = [];
  var athleteNames = [];
  for (var i = 0; i !== athletes.length; ++i) {
    athletesObj[i] = JSON.stringify(athletes[i]);
    athleteNames.push(athletes[i].athleteName);
  }
  return createSettings(
    athleteNames, //athleteNames
    athletesObj, //athletes
    deadlineTime, //deadlineTime
    10, //cooldownMinutes
    10, //entriesAllowedPerContestant
    10, //entryFee
    games,  //games
    false,  //isfiftyfifty
    8000, //maxWager
    10, //maximumEntries
    9,  //minimumEntries
    {1: 60, 2: 25}, //payouts
    sport,  //sport
    10000,  //startingVirtualMoney
    85  //totalPrizePool
  );
}

function createType1Settings () {
  var payoutsListNormal = {};
  payoutsListNormal[2] = [1.8];
  payoutsListNormal[3] = [2.7];
  payoutsListNormal[5] = [3, 1.5];
  payoutsListNormal[10] = [4, 3, 2];
  payoutsListNormal[12] = [5, 3, 2];
  payoutsListNormal[14] = [6, 3.5, 2.5];
  payoutsListNormal[23] = [8, 5, 4, 3];
  payoutsListNormal[56] = [17, 10, 6, 4, 3];
  for (var i = 5; i < 10; i++) {
    payoutsListNormal[56][i] = 2;
  }
  payoutsListNormal[112] = [25, 16, 12, 7, 5];
  for (var i = 5; i < 20; i++) {
    if (i < 10) {
      payoutsListNormal[112][i] = 3;
    }
    else {
      payoutsListNormal[112][i] = 2;
    }
  }
  payoutsListNormal[167] = [30, 15, 12, 10];
  for (var i = 4; i < 25; i++) {
    if (i < 6) {
      payoutsListNormal[167][i] = 7.5;
    }
    else if (i < 9) {
      payoutsListNormal[167][i] = 5;
    }
    else if (i < 14) {
      payoutsListNormal[167][i] = 4;
    }
    else {
      payoutsListNormal[167][i] = 3;
    }
  }
  payoutsListNormal[230] = [40, 27, 18, 12, 8];
  for (var i = 5; i < 40; i++) {
    if (i < 10) {
      payoutsListNormal[230][i] = 4;
    }
    else if (i < 20) {
      payoutsListNormal[230][i] = 3;
    }
    else if (i < 30) {
      payoutsListNormal[230][i] = 2.5;
    }
    else {
      payoutsListNormal[230][i] = 2;
    }
  }
  payoutsListNormal[1150] = [100, 65, 40, 30, 25, 20, 16, 14, 13, 11];
  for (var i = 10; i < 225; i++) {
    if (i < 15) {
      payoutsListNormal[1150][i] = 10;
    }
    else if (i < 20) {
      payoutsListNormal[1150][i] = 8;
    }
    else if (i < 30) {
      payoutsListNormal[1150][i] = 6;
    }
    else if (i < 40) {
      payoutsListNormal[1150][i] = 5;
    }
    else if (i < 50) {
      payoutsListNormal[1150][i] = 4;
    }
    else if (i < 100) {
      payoutsListNormal[1150][i] = 3.4;
    }
    else if (i < 150) {
      payoutsListNormal[1150][i] = 2.4;
    }
    else {
      payoutsListNormal[1150][i] = 2;
    }
  }

  var totalPrizePoolList = {
                         2: 1.8,
                         3: 2.7,
                         5: 4.5,
                         10: 9,
                         12: 10,
                         14: 12,
                         23: 20,
                         56: 50,
                         112: 100,
                         167: 150,
                         230: 200,
                         1150: 1014
                       }

  return function (athletes, games, deadlineTime, entryFee, isFiftyFifty,
                   maximumEntries, sport, startingVirtualMoney) {
    var athletesObj = [];
    var athleteNames = [];
    for (var i = 0; i !== athletes.length; ++i) {
      athletesObj[i] = JSON.stringify(athletes[i]);
      athleteNames.push(athletes[i].athleteName);
    }

    var payouts = [];
    var totalPrizePool = null;
    if (isFiftyFifty) {
      payouts = Array.apply(null, { length: (maximumEntries - 1) / 2 }).map(
        function () {
          return 2 * entryFee;
        });
      totalPrizePool = (maximumEntries - 1) * entryFee;
    }
    else {
      payouts = payoutsListNormal[maximumEntries].map(
        function (payout) {
          return payout * entryFee;
        });
      totalPrizePool = totalPrizePoolList[maximumEntries] * entryFee
    }

    return createSettings(
      athleteNames, //athleteNames
      athletesObj, //athletes
      deadlineTime, //deadlineTime
      10, //cooldownMinutes
      Math.floor(maximumEntries * 0.5), //entriesAllowedPerContestant
      entryFee, //entryFee
      games,  //games
      isFiftyFifty,  //isfiftyfifty
      Math.floor(startingVirtualMoney * 0.8), //maxWager
      maximumEntries, //maximumEntries
      0,//Math.floor(totalPrizePool / entryFee),  //minimumEntries
      payouts, //payouts
      sport,  //sport
      startingVirtualMoney,  //startingVirtualMoney
      totalPrizePool  //totalPrizePool
    );
  }
}

exports.createTypeOne = createType1Settings();