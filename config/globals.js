/**
 * ====================================================================
 * Author: Harrison Zhao
 * ====================================================================
 */
'use strict';
/**
 * contains cached bets
 * @type {Object}
 */
/*
pending bet format:
{
  athleteId uuid, --
  athleteImage text, --
  athleteName text, --
  athleteTeam text, --
  betId timeuuid, --

  bettor (text)
  expiration (timestamp formatted as milliseconds since epoch)
  overNotUnder (boolean specifying over or under bet position available)
  price (double)

  fantasyValue double, --
  gameId uuid, --
  payoff double --
  sport
}

resell bet format:
{
  athleteId uuid, --
  athleteImage text, --
  athleteName text, --
  athleteTeam text, --
  betId timeuuid, --

  overNotUnder boolean, --true if selling over position, false if selling under
  seller: text,
  expiration: timestamp formatted as milliseconds since epoch,
  price: double,

  fantasyValue double, --
  gameId uuid, --
  payoff double --
  sport
}

taken bet format:
{
  athleteId uuid, --
  athleteName text, --
  athleteTeam text, --
  betId timeuuid, --

  overNotUnder --true if over position, false if under position
  owner: , -- owner of the position
  opponent: , -- opponent in other position
  price:  -- price purchased for

  fantasyValue double, --
  gameId uuid, --
  payoff double --
  sport
}

timeseries is a map of athleteId to formatted array formatted as an object:
{
  fantasyVal: double
  timeVal: date object
}
 */

//timeseries limited to 1000 datapoints per player
exports.contestA = {
  pendingBets: [],
  resellBets: [],
  takenBets: [],
  pendingBetIdToArrayIndex: {},
  overResellBetIdToArrayIndex: {},
  underResellBetIdToArrayIndex: {},
  overTakenBetIdToArrayIndex: {},
  underTakenBetIdToArrayIndex: {},
  timeseries: {}
}

/**
 * contains cached contests
 * @type {Object}
 */
exports.contestB = {
  contests: []
}

//maps of athleteId to athlete id in array
//list of player names too
/*
  fields for athlete objects (regardless of sport)

    age: athlete.age,
    id: athlete.athlete_id,
    firstName: athlete.first_name,
    fullName: athlete.full_name,
    height: athlete.height,
    image: athlete.image_url (currently not in database),
    lastName: athlete.last_name,
    longTeamName: athlete.long_team_name,
    position: athlete.position,
    shortTeamName: athlete.short_team_name,
    sport: [SPORT] (not in database),
    statistics: array of 10 most recent statistics object,
    status: athlete.status,
    teamId: athlete.teamId,
    uniformNumber: athlete.uniform_number,
    weight: athlete.weight 
 */
exports.athletes = {
  baseballList: [],
  baseballIdMap: {},
  footballList: [],
  footballIdMap: {},
  basketballList: [],
  basketballIdMap: {},
  allAthletesList: [],
  allAthletesIdMap: {}
}

/*
  JSON stringified object:
  {
    athletesList: array of athlete objects
    athletesIdMap: map of athleteIds to indicies in athletesList
  }
 */
exports.allAthletesCacheJSON = null;

exports.games = {
  Baseball: {
    //gameId: object containing game date
  }
}

exports.currentSportsInSeason = {
  
};
