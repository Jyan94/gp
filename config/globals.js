/**
 * contains cached bets
 * @type {Object}
 */
/*
generic bet:
{
  athleteId uuid, --
  athleteName text, --
  athleteTeam text, --
  betId timeuuid, --
  bettorUsernames list<text> ??,
  expirations list<timestamp>,  ??
  fantasyValue double, --
  gameId uuid, --
  isSellingPosition list<boolean>, ??
  oldPrices,
  payoff double, --
  prices list<double>, ??
  sport text --
}

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
exports.contestA = {
  pendingBets: [
    {
      athleteId: '10154eef-8834-48e0-97e7-d7436367534c',
      athleteName: 'Adrian Gonzalez',
      athleteTeam: 'LA',
      bettor: 'hello world',
      overNotUnder: true,
      price: 12
    }
    ],
  resellBets: [],
  takenBets: []
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
      weight: 200
    }
  },
  Football: {

  },
  Basketball: {

  }
}

exports.games = {
  Baseball: {
    //gameId: object
  }
}

exports.currentSportsInSeason = {
  
};