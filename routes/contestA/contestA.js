'use strict';
(require('rootpath')());

var configs = require('config/index.js');

var async = require('async');
var User = require('libs/cassandra/user');
var ContestA = require('libs/contestA/exports');
var FormatBets = ContestA.FormatBets;
var ModifyBets = ContestA.ModifyBets;
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
 * SEND MARKET HOME GAMES
 * ====================================================================
 */

function filterGames(game, callback) {
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

function sendMarketHomeGames(req, res, next) {
  Game.selectTodaysGames(function (err, games) {
    if (err) {
      res.send(500, 'Something went wrong with the database.');
    }
    else {
      async.map(games, filterGames, function (err, games) {
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

/**
 * places a pending bet
 * @param  {object}   req
 * req.body must have fields
 * 
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
/*
 * ====================================================================
 * EXPORTS
 * ====================================================================
 */

exports.renderMarketHome = renderMarketHome;
exports.sendMarketHomeGames = sendMarketHomeGames;
exports.getMarket = getMarket;
exports.getMarketBets = getMarketBets;
exports.renderPortfolio = renderPortfolio;