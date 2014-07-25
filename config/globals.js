/**
 * contains cached bets
 * @type {Object}
 */
/*
pending bet format:
{
  athleteId uuid, --
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
}

resell bet format:
{
  athleteId uuid, --
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
}
 */

/*
client: ajax request for bets
server: sends pending bets array and map of betIds to array indices
client: iterates through bets currently displayed and checks against new array
 */
exports.contestA = {
  pendingBets: [
    {
      athleteId: '10154eef-8834-48e0-97e7-d7436367534c',
      athleteName: 'Adrian Gonzalez',
      athleteTeam: 'LA',
      bettor: 'hello world',
      overNotUnder: true,
      price: 12
    },
    {
      athleteId: '10154eef-8834-48e0-97e7-d7436367534c',
      athleteName: 'Adrian Gonzalez',
      athleteTeam: 'LA',
      better: 'hello world',
      overNotUnder: false,
      price: 13
    },
    {
      athleteId: '10154eef-8834-48e0-97e7-d7436367534c',
      athleteName: 'Adrian Gonzalez',
      athleteTeam: 'LA',
      better: 'hello world',
      overNotUnder: true,
      price: 12
    },
    {
      athleteId: '10154eef-8834-48e0-97e7-d7436367534c',
      athleteName: 'Adrian Gonzalez',
      athleteTeam: 'LA',
      better: 'hello world',
      overNotUnder: false,
      price: 14
    },
    {
      athleteId: '10154eef-8834-48e0-97e7-d7436367534c',
      athleteName: 'Adrian Gonzalez',
      athleteTeam: 'LA',
      better: 'hello world',
      overNotUnder: true,
      price: 11
    },
    {
      athleteId: '10154eef-8834-48e0-97e7-d7436367534c',
      athleteName: 'Adrian Gonzalez',
      athleteTeam: 'LA',
      better: 'hello world',
      overNotUnder: false,
      price: 14
    },
    {
      athleteId: '10154eef-8834-48e0-97e7-d7436367534c',
      athleteName: 'Adrian Gonzalez',
      athleteTeam: 'LA',
      better: 'hello world',
      overNotUnder: true,
      price: 12
    },
    {
      athleteId: '10154eef-8834-48e0-97e7-d7436367534c',
      athleteName: 'Adrian Gonzalez',
      athleteTeam: 'LA',
      better: 'hello world',
      overNotUnder: false,
      price: 10
    },
    {
      athleteId: '10154eef-8834-48e0-97e7-d7436367534c',
      athleteName: 'Adrian Gonzalez',
      athleteTeam: 'LA',
      better: 'hello world',
      overNotUnder: true,
      price: 12
    },
    {
      athleteId: '10154eef-8834-48e0-97e7-d7436367534c',
      athleteName: 'Adrian Gonzalez',
      athleteTeam: 'LA',
      better: 'hello world',
      overNotUnder: false,
      price: 10
    }
    ],
  resellBets: [],
  takenBets: [],
  pendingBetIdToArrayIndex: {},
  resellBetIdToArrayIndex: {}
}

/**
 * contains cached contests
 * @type {Object}
 */
exports.contestB = {
  contests: []
}

exports.athletes = {
  Baseball: {
    '10154eef-8834-48e0-97e7-d7436367534c': {
      age: 100,
      currentValue: 10,
      firstName: 'Adrian',
      fullName: 'Adrian Gonzalez',
      height: 61,
      image: 'google.com',
      lastName: 'Gonzalez',
      longTeamName: 'Los Angeles Dodgers',
      position: 'first base',
      short_team_name: 'LA',
      statistics: {'10/7/07': ''},
      status: 'active',
      uniform_number: 23,
      weight: 200,
      timeseries: []
    }
  },
  Football: {

  },
  Basketball: {

  }
}

exports.games = {
  Baseball: {
    //gameId: object containing game date
  }
}

exports.currentSportsInSeason = {
  
};
