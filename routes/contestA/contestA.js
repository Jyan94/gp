'use strict';
(require('rootpath')());

var configs = require('config/index.js');

var async = require('async');
var ContestA = require('libs/contestA/exports');
var FormatBets = ContestA.FormatBets;
var ModifyBets = ContestA.ModifyBets;
var GetTimeseries = ContestA.GetTimeseries;
var Athletes = require('libs/athletes/exports');

/*
 * ====================================================================
 * PORTFOLIO
 * ====================================================================
 */

function renderMarketHome(req, res) {
  res.render('contestA/marketHome.html');
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
      res.send('Bet successfully made!');
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
exports.getMarket = getMarket;
exports.getMarketBets = getMarketBets;
exports.getTimeseries = getTimeseries;
exports.getAllAthletes = getAllAthletes;
exports.renderPortfolio = renderPortfolio;
exports.renderGraph = renderGraph;

exports.takePendingBet = takePendingBet;
exports.placePendingBet = placePendingBet;
exports.removePendingBet = removePendingBet;