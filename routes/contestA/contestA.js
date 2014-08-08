/* TODO: DONT USE CACHE FOR CALCULATING PAYOUTS */
/* TODO: DONT USE CACHE FOR CALCULATING PAYOUTS */
/* TODO: DONT USE CACHE FOR CALCULATING PAYOUTS */
/* TODO: DONT USE CACHE FOR CALCULATING PAYOUTS */
/* TODO: DONT USE CACHE FOR CALCULATING PAYOUTS */
/* TODO: DONT USE CACHE FOR CALCULATING PAYOUTS */
/* TODO: DONT USE CACHE FOR CALCULATING PAYOUTS */
/* TODO: DONT USE CACHE FOR CALCULATING PAYOUTS */
/* TODO: DONT USE CACHE FOR CALCULATING PAYOUTS */
/* TODO: DONT USE CACHE FOR CALCULATING PAYOUTS */
/* TODO: DONT USE CACHE FOR CALCULATING PAYOUTS */

'use strict';
(require('rootpath')());

var configs = require('config/index.js');

var async = require('async');
var ContestA = require('libs/contestA/exports');
var ContestADirect = require('libs/cassandra/contestA/exports');
var FormatBets = ContestA.FormatBets;
var ModifyBets = ContestA.ModifyBets;
var GetTimeseries = ContestA.GetTimeseries;
var Athletes = require('libs/athletes/exports');
var Games = require('libs/games/exports');
var GamesDirect = require('libs/cassandra/baseball/game');
var User = require('libs/cassandra/user');

var contestAGlobals = configs.globals.contestA;
var customSetInterval = configs.constants.globals.customSetInterval;

/*
 * ====================================================================
 * RENDER MARKET HOME
 * ====================================================================
 */

function renderMarketHome(req, res, next) {
  res.render('contestA/marketHome.hbs', { user: req.user });
}

/*
 * ====================================================================
 * SEND MARKET HOME DAILY BOXSCORES
 * ====================================================================
 */
/*
function parseDailyBoxscores(game, callback) {
  callback(null,
    {
      awayScore: game.away_score,
      currentInning: game.current_inning,
      homeScore: game.home_score,
      gameId: game.game_id,
      startTime: game.start_time,
      shortAwayName: game.short_away_name,
      shortHomeName: game.short_home_name,
      status: game.status
    });
}

function sendMarketHomeDailyBoxscores(req, res, next) {
  Game.selectTodaysGames(function (err, games) {
    if (err) {
      res.send(500, 'Something went wrong with the database.');
    }
    else {
      async.map(games, parseDailyBoxscores, function (err, games) {
        if (err) {
          res.send(500, 'WTF');
        }
        else {
          res.send(JSON.stringify(games));
        }
      });
    }
  });
}
*/
/*
 * ====================================================================
 * SEND MARKET HOME TOP PLAYERS
 * ====================================================================
 */

/*
function parseTopPlayers(athlete, callback) {
  var statistics = athlete.statistics;
  var statisticsLength = athlete.statistics.length;
  var fantasyPoints = [
    (statisticsLength > 0 ? statistics[statisticsLength - 1].fantasyPoints: 0),
    (statisticsLength > 1 ? statistics[statisticsLength - 2].fantasyPoints: 0)
  ];
  var change = fantasyPoints[0] - fantasyPoints[1];


  callback(null,
    {
      athleteId: athlete.id,
      change: change,
      fullName: athlete.fullName,
      shortTeamName: athlete.shortTeamName,
      fantasyPoints: fantasyPoints
    });
}


function sendMarketHomeTopPlayers(req, res, next) {
  async.waterfall([
    function (callback) {
      callback(null, Athletes.Select.getAllAthletesList());
    },
    function (athletes, callback) {
      async.map(athletes, parseTopPlayers, callback);
    },
    function (athletes, callback) {
      async.sortBy(athletes,
        function(athlete, callback) {
          callback(null, -1 * athlete.change);
        }, callback);
    },
    function (athletes, callback) {
      res.send(JSON.stringify(athletes.slice(0, 50)));
    }],
    function (err) {
      next(err);
    });
}
*/
/*
 * ====================================================================
 * PORTFOLIO
 * ====================================================================
 */

function renderPortfolio(req, res) {
  res.render('contestA/portfolio.hbs');
}

/*
 * ====================================================================
 * Bets
 * ====================================================================
 */
function getMarket(req, res) {
  res.render('testMarket.hbs');
}

function getMarketBets(req, res) {
  var username = req.user.username;
  async.parallel(
  [
    function(callback) {
      FormatBets.getPrimaryMarket(username, callback);
    },
    function(callback) {
      FormatBets.getSecondaryMarket(username, callback);
    }
  ],
  function(err, result) {
    res.send({
      pending: result[0],
      pendingHash: FormatBets.getPendingBetsHash(),
      resell: result[1],
      resellHash: FormatBets.getResellBetsHashes()
    });
  });
}

//support for looking at other user's bets?
function getUserBets(req, res) {
  var username = req.user.username;
  async.parallel(
  [
    function(callback) {
      FormatBets.getUserPending(username, callback);
    },
    function(callback) {
      FormatBets.getUserResell(username, callback);
    },
    function(callback) {
      FormatBets.getUserTaken(username, callback);
    }
  ],
  function(err, results) {
    res.send({
      pending: results[0],
      pendingHash: FormatBets.getPendingBetsHash(),
      resell: results[1],
      resellHash: FormatBets.getResellBetsHashes(),
      taken: results[2],
      takenHash: FormatBets.getTakenBetsHashes()
    });
  });
}

/*
 * ====================================================================
 * Bet modification routes
 * SEE libs/contestA/modifyBets for documentation on functions
 * ====================================================================
 */
/**
 * places a pending bet
 * @param  {object}   req
 * req.body must have fields
  athleteId,
  athleteImage,
  athleteName,
  athletePosition,
  athleteTeam,
  expirationTimeMinutes,
  fantasyValue,
  gameId,
  isOverBettor,
  sport,
  wager
 * @param  {object}   res
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
function placePendingBet(req, res, next) {
  //TEMPORARY FIX FOR NON-PULLED GAMES
  if (configs.isDev()) {
    req.body.gameId = configs.constants.contestAbets.DEFAULT_GAME_ID;
  }
  req.body.fantasyValue = parseFloat(req.body.fantasyValue);
  req.body.wager = parseFloat(req.body.wager);
  req.body.isOverBettor = (req.body.isOverBettor === 'true');
  ModifyBets.insertPending(req.body, req.user, function(err) {
    if (err) {
      next(err);
    }
    else {
      res.send({'success': 'Bet successfully made!', 'status': 200});
    }
  });
}

/**
 * places a pending bet
 * @param  {object}   req
 * req.body must have fields
   betId
   isOverBettor
   wager
 * @param  {object}   res
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
function removePendingBet(req, res, next) {
  ModifyBets.deletePending(req.body, req.user, function(err) {
    if (err) {
      next(err);
    }
    else {
      res.send({'success': 'Bet successfully deleted!', 'status': 200});
    }
  });
}

/**
 * places a pending bet
 * @param  {object}   req
 * req.body must have fields
    athleteId,
    athleteName,
    athleteTeam,
    betId,
    fantasyValue,
    opponent,
    overNotUnder,
    wager
 * @param  {object}   res
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
function takePendingBet(req, res, next) {
  req.query.fantasyValue = parseFloat(req.query.fantasyValue);
  req.query.payoff = parseFloat(req.query.payoff);
  req.query.price = parseFloat(req.query.price);
  req.query.overNotUnder = (req.query.overNotUnder === 'true');
  ModifyBets.takePending(req.query, req.user, function(err) {
    if (err) {
      next(err);
    }
    else {
      res.send({'success': 'Bet successfully taken!', 'status': 200});
    }
  });
}

function placeResellBet(req, res, next) {
  ModifyBets.placeResell(req.body, req.user, function(err) {
    if (err) {
      next(err);
    }
    else {
      res.send(
        {'success': 'Bet successfully placed in resell!', 'status': 200});
    }
  });
}

function takeResellBet(req, res, next) {
  ModifyBets.takeResell(req.body, req.user, function(err) {
    if (err) {
      next(err);
    }
    else {
      res.send({'success': 'Bet successfully taken!', 'status': 200});
    }
  });
}

function getTimeseries(req, res, next) {
  if (req.query.timeUpdate) {
    req.query.timeUpdate = parseInt(req.query.timeUpdate);
  }
  GetTimeseries.getByAthleteId(
    req.query.athleteId,
    req.query.timeUpdate,
    function(err, result) {
      if (err) {
        next(err);
      }
      else {
        res.send(result);
      }
    });
}

//for the route: /initialAthletesLoad
//sends allAthletesCacheJSON to browser
function getAllAthletes(req, res) {
  res.send(Athletes.Select.getAllAthletesJSON());
}

function getTodaysGames(req, res, next) {
  /*console.log(Games.Select.getAllGamesList(), 111111111);
  async.map(Games.Select.getAllGamesList(),
    function (game, callback) {
      callback(null, {
        awayScore: game.awayScore,
        currentInning: game.currentInning,
        gameDate: game.gameDate,
        homeScore: game.homeScore,
        id: game.id,
        longAwayName: game.longAwayName,
        longHomeName: game.longHomeName,
        shortAwayName: game.shortAwayName,
        shortHomeName: game.shortHomeName, //acronym for home team
        startTime: game.startTime,
        status: game.status
      });
    },
    function (err, games) {
      if (err) {
        next(err);
      }
      else {
        res.send(JSON.stringify(games));
      }
    });*/
  res.send(Games.Select.getAllGamesJSON());
}

/*
 * ====================================================================
 * BET BACKGROUND FUNCTIONS (PENDING)
 * ====================================================================
 */

function checkGameEnd (pendingBet, callback) {
  var gameId = pendingBet.gameId;
  var game = Games.Select.getGameById(gameId);

  if (typeof(game) === 'undefined') {
    GamesDirect.select(gameId,
      function (err, game) {
        callback(!err && (game.status === 'closed'));
      });
  }
  else {
    callback(game.status === 'closed');
  }
}

function changeBetStateToExpired (bet, callback) {
  ContestADirect.UpdateBet.setExpired(bet.betId, callback);
}

function updateStateBetsPending (callback) {
  var pendingBets = contestAGlobals.pendingBets;

  async.waterfall([
    function (callback) {
      async.filter(pendingBets, checkGameEnd,
        function (result) {
          callback(null, result);
        });
    },
    function (expiringBets, callback) {
      async.map(expiringBets, changeBetStateToExpired, callback);
    }],
    function (err) {
      callback(err);
    });
}

/*
 * ====================================================================
 * BET BACKGROUND FUNCTIONS (ACTIVE)
 * ====================================================================
 */

function getFantasyPointsResultForBet (bet, callback) {
  var gameId = bet.gameId;
  var athlete = Athletes.Select.getAthleteById(bet.athleteId);

  async.reduce(athlete.statistics, null,
    function (memo, statistic, callback) {
      callback(null, (
        (statistic.gameId === gameId) ? statistic.fantasyPoints : memo));
    },
    function (err, fantasyPointsResult) {
    //Add if game is not in statistics pulled
      callback(err, fantasyPointsResult ? fantasyPointsResult : 0);
    });
}

function calculateWinnings (bet, fantasyPointsResult, callback) {
  //Does not support resell
  var fantasyPointsPrediction = bet.fantasyValue;

  if (fantasyPointsResult === fantasyPointsPrediction) {
    async.parallel([
        function (callback) {
          User.addMoneyToUserUsingUsername(bet.payoff * 0.25, bet.owner, callback);
        },
        function (callback) {
          User.addMoneyToUserUsingUsername(bet.payoff * 0.25, bet.opponent, callback);
        }
      ], callback);
  }
  else {
    var winnerUsername = null;

    if (fantasyPointsResult < fantasyPointsPrediction) {
      winnerUsername = (bet.overNotUnder ? bet.opponent : bet.owner); 
    }
    else {
      winnerUsername = (bet.overNotUnder ? bet.owner : bet.opponent);
    }

    User.addMoneyToUserUsingUsername(bet.payoff * 0.45, winnerUsername,
      function (err) {
        callback(err);
      });
  }
}

function changeBetStateToProcessed (bet, callback) {
  async.parallel([
    function (callback) {
      async.waterfall([
        function (callback) {
          getFantasyPointsResultForBet(bet, callback);
        },
        function (fantasyPointsResult, callback) {
          calculateWinnings(bet, fantasyPointsResult, callback);
        }], callback);
    },
    function (callback) {
      ContestADirect.UpdateBet.setProcessed(bet.betId, callback);
    }], callback);
}

function updateStateBetsActive (callback) {
  //Apparently all bets are both resell and taken
  var activeBets = contestAGlobals.resellBets.concat(contestAGlobals.takenBets);
  //var activeBets = contestAGlobals.takenBets;

  async.waterfall([
    function (callback) {
      async.filter(activeBets, checkGameEnd,
        function (result) {
          callback(null, result);
        });
    },
    function (toBeProcessedBets, callback) {
      async.map(toBeProcessedBets, changeBetStateToProcessed, callback);
    }],
    function (err) {
      callback(err);
    });
}

/*
 * ====================================================================
 * EXPORTS
 * ====================================================================
 */

exports.renderMarketHome = renderMarketHome;
/*exports.sendMarketHomeDailyBoxscores = sendMarketHomeDailyBoxscores;
exports.sendMarketHomeTopPlayers = sendMarketHomeTopPlayers;*/
exports.getMarket = getMarket;
exports.getMarketBets = getMarketBets;
exports.getTimeseries = getTimeseries;
exports.getAllAthletes = getAllAthletes;
exports.getTodaysGames = getTodaysGames;
exports.renderPortfolio = renderPortfolio;
exports.takePendingBet = takePendingBet;
exports.placePendingBet = placePendingBet;
exports.removePendingBet = removePendingBet;
exports.updateStateBetsPending = updateStateBetsPending;
exports.updateStateBetsActive = updateStateBetsActive;
