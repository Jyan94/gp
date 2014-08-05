'use strict';
(require('rootpath')());

var configs = require('config/index.js');

var async = require('async');
var User = require('libs/cassandra/user');
var ContestA = require('libs/contestA/exports');
var FormatBets = ContestA.FormatBets;
var ModifyBets = ContestA.ModifyBets;
var GetTimeseries = ContestA.GetTimeseries;
var Athletes = require('libs/athletes/exports');
var Game = require('libs/cassandra/baseball/game.js')
var Player = require('libs/cassandra/baseball/player.js')

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


function findTopPlayers(player, callback) {


  callback(null,
    {
      awayScore: game.away_score,
      homeScore: game.home_score,
      startTime: game.start_time,
      shortAwayName: game.short_away_name,
      shortHomeName: game.short_home_name,
      status: game.status
    });
}

function parseTopPlayers(player, callback) {
  var statistics
}

function sendMarketHomeTopPlayers(req, res, next) {
  async.waterfall([
    Player.selectAll,
    function (players, callback) {
      async.map(players, parseTopPlayers, callback);
    },
    function ()],
    ,
    function (err) {
      next(err);
    });

  Player.selectAll(function (err, players) {
    if (err) {
      res.send(500, 'Something went wrong with the database.');
    }
    else {
      async.map(players, findTopPlayers, function (err, players) {
        if (err) {
          res.send(500, 'WTF');
        }
        else {
          console.log(players);
          res.send(JSON.stringify(players));
        }
      });
    }
  });
}

/*
 * ====================================================================
 * SEND MARKET HOME PLAYER STATISTICS
 * ====================================================================
 */

function parsePlayerStatistics(game, callback) {
  callback(null,
    {
      awayScore: game.away_score,
      homeScore: game.home_score,
      startTime: game.start_time,
      shortAwayName: game.short_away_name,
      shortHomeName: game.short_home_name,
      status: game.status
    });
}

function sendMarketHomePlayerStatistics(req, res, next) {
  Player.selectAll(function (err, players) {
    if (err) {
      res.send(500, 'Something went wrong with the database.');
    }
    else {
      async.map(players, parsePlayerStatistics, function (err, player) {
        if (err) {
          res.send(500, 'WTF');
        }
        else {
          console.log(games);
          res.send(JSON.stringify(games));
        }
      });
    }
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

function renderGraph(req, res) {
  res.render('handlebarsPartials/contestATimeseriesAthleteGraph.html');
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
  isOverBetter,
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
      res.send('Bet successfully made!');
    }
  });
}

/**
 * places a pending bet
 * @param  {object}   req
 * req.body must have fields
   betId
   isOverBetter
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
      res.send('Bet successfully deleted!');
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
  ModifyBets.takePending(req.body, req.user, function(err) {
    if (err) {
      next(err);
    }
    else {
      res.send('Bet successfully taken!');
    }
  });
}

function placeResellBet(req, res, next) {
  ModifyBets.placeResell(req.body, req.user, function(err) {
    if (err) {
      next(err);
    }
    else {
      res.send('Bet successfully placed in resell!');
    }
  });
}

function takeResellBet(req, res, next) {
  ModifyBets.takeResell(req.body, req.user, function(err) {
    if (err) {
      next(err);
    }
    else {
      res.send('Bet successfully taken!');
    }
  });
}

function getTimeseries(req, res, next) {
  if (req.query.timeUpdate) {
    req.query.timeUpdate= parseInt(req.query.timeUpdate);
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
exports.renderPortfolio = renderPortfolio;
exports.renderGraph = renderGraph;
