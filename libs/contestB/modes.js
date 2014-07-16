/**
 * ====================================================================
 * Author: Harrison Zhao
 * ====================================================================
 */
'use strict';
(require('rootpath')());
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
function createType1Settings(athletes, games, deadlineTime, sport) {
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

exports.createTypeOne = createType1Settings;