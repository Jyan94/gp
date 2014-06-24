'use strict';
(require('rootpath')());
var configs = require('config/index.js');
var cql = configs.cassandra.cql;

/*
  schema for contestB:
  athletes map<int, text>,
  commission_earned int,
  contest_deadline_time timestamp,
  contest_end_time timestamp,
  contest_id uuid,
  contest_start_time timestamp,
  contest_state int,
  contestants map<text, text>,
  current_entries int,
  entries_allowed_per_contestant int,
  entry_fee int,
  game_type text,
  lock_current_entries boolean,
  max_wager int,
  maximum_entries int,
  minimum_entries int,
  pay_outs map<int, double>,
  processed_payouts_time timestamp,
  sport text,
  starting_virtual_money int,
  total_prize_pool int
 */

/**
 * returns a settings array for database query insertion of contests
 * entries is for contest_count_entries table
 * mode is for contest_B table
 *   
 * @param  {Object} athletes
 *         map of an int, as string, 0-x number of athletes to athlete type
 * @param  {int} commissionEarned
 *         determined after sport event ends and payouts are calculated
 * @param  {int} entriesAllowedPerContestant
 *         maximum entries allowed for a given contestant
 * @param  {Date} deadlineTime
 *         time when both no additional players can join and bets are locked in
 * @param  {int} entryFee
 * @param  {text} gameType             
 *         brief text describing gametype
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
  athletes,
  deadlineTime,
  entriesAllowedPerContestant,
  entryFee,
  gameType,
  maxWager,
  maximumEntries,
  minimumEntries,
  payouts,
  sport,
  startingVirtualMoney,
  totalPrizePool) {

  return [
    athletes, //athletes
    0,  //commission_earned
    deadlineTime, //contest_deadline_time
    null, //contest_end_time
    cql.types.uuid(), //contest_id
    new Date(), //contest_start_time
    0,  //contest_state
    {}, //contestants
    0,  //current_entries
    entriesAllowedPerContestant, //entries_allowed_per_contestant
    entryFee, //entry_fee
    gameType, //game_type
    null, //last_locked
    false,  //lock_current_entries
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

/*
  athletes
  deadlineTime
  entriesAllowedPerContestant,
  entryFee,
  gameType,
  maxWager
  maximumEntries,
  minimumEntries,
  payouts,
  sport,
  startingVirtualMoney,
  totalPrizePool
 */
function createType1Settings(athletes, deadlineTime, sport) {
  return createSettings(
    athletes,
    deadlineTime,
    10,
    10,
    'daily prophet',
    8000,
    10,
    9,
    {
      1: 60,
      2: 25
    },
    sport,
    10000,
    85
  );
}

exports.createTypeOne = createType1Settings;