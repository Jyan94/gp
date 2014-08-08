'use strict';
(require('rootpath')());

var configs = require('config/index.js');

var async = require('async');
var ContestA = require('libs/contestA/exports');
var FormatBets = ContestA.FormatBets;
var ModifyBets = ContestA.ModifyBets;
var GetTimeseries = ContestA.GetTimeseries;
var Athletes = require('libs/athletes/exports');
var Game = require('libs/cassandra/baseball/game.js')

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

/*
 * ====================================================================
 * SEND MARKET HOME TOP PLAYERS
 * ====================================================================
 */


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
 * SEND MARKET HOME PLAYER STATISTICS
 * ====================================================================
 */

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

/*
 * ====================================================================
 * EXPORTS
 * ====================================================================
 */

exports.renderMarketHome = renderMarketHome;
exports.sendMarketHomeDailyBoxscores = sendMarketHomeDailyBoxscores;
exports.sendMarketHomeTopPlayers = sendMarketHomeTopPlayers;
exports.getMarket = getMarket;
exports.getMarketBets = getMarketBets;
exports.getTimeseries = getTimeseries;
exports.getAllAthletes = getAllAthletes;
exports.renderPortfolio = renderPortfolio;
exports.takePendingBet = takePendingBet;
exports.placePendingBet = placePendingBet;
exports.removePendingBet = removePendingBet;