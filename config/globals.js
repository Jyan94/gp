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
 */

/*
client: ajax request for bets
server: sends pending bets array and map of betIds to array indices
client: iterates through bets currently displayed and checks against new array

server sends: {
}
 */
exports.contestA = {
  pendingBets: [],
  resellBets: [],
  takenBets: [],
  pendingBetIdToArrayIndex: {},
  overResellBetIdToArrayIndex: {},
  underResellBetIdToArrayIndex: {},
  overTakenBetIdToArrayIndex: {},
  underTakenBetIdToArrayIndex: {}
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
    image: athlete.image_url,
    lastName: athlete.last_name,
    longTeamName: athlete.long_team_name,
    position: athlete.position,
    shortTeamName: athlete.short_team_name,
    sport: [SPORT] (not in database)
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
  allAthletesList: []
}

exports.games = {
  Baseball: {
    //gameId: object containing game date
  }
}

exports.currentSportsInSeason = {
  
};
