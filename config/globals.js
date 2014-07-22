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

  better (text)
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

  isSellingPosition - array of length 2 contains 2 booleans
  bettorUsernames - array of length 2 contains users for respective positions
  expirations - array of length 2 contains expirations for bets
  prices - array of length 2 contains prices for resell positions

  fantasyValue double, --
  gameId uuid, --
  payoff double --
}

TO DO taken bet formatting
 */
exports.contestA = {
  pendingBets: [
    {
      athleteId: '10154eef-8834-48e0-97e7-d7436367534c', 
      athleteName: 'Adrian Gonzalez', 
      athleteTeam: 'LA',
      better: 'hello world',
      overNotUnder: true,

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
    athletes:
    {
      '10154eef-8834-48e0-97e7-d7436367534c': {
        athleteName: 'Adrian Gonzalez',
        athleteTeam: 'LA',
        position: 'IF',
        image: 'www.google.com'
      }
    }
  }
}