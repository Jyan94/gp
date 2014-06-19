'use strict';
(require('rootpath')());
var configs = require('config/index.js');
var cql = configs.cassandra.cql;

/**
 * returns a settings object for database query insertion of contests
 * entries is for contest_count_entries table
 * mode is for contest_B table
 * 
 * @param  {int} maximumEntries
 * @param  {int} minimumEntries
 *   
 * @param  {Object} athletes
 *         map of an int, as string, 0-x number of athletes to athlete type
 * @param  {int} commissionEarned
 *         determined after sport event ends and payouts are calculated
 * @param  {Date} deadlineTime
 *         time when both no additional players can join and bets are locked in
 * @param  {int} entryFee
 * @param  {text} gameType             
 *         brief text describing gametype
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
  maximumEntries,
  minimumEntries,
  athletes,
  deadlineTime,
  entryFee,
  gameType,
  payouts,
  sport,
  startingVirtualMoney,
  totalPrizePool) {

  return [
    [
      cql.types.uuid(),
      maximumEntries,
      minimumEntries
    ], [
      athletes,
      0,
      deadlineTime,
      null,
      cql.types.uuid(),
      new Date(),
      0,
      {},
      entryFee,
      gameType,
      payouts,
      null,
      sport,
      startingVirtualMoney,
      totalPrizePool
    ]
  ];
}

function createType1Settings(athletes, deadlineTime, sport) {
  return createSettings(
    10,
    9,
    athletes,
    deadlineTime,
    10,
    'daily prophet',
    {
      1: 60,
      2: 25
    },
    sport,
    10000,
    85
  );
}