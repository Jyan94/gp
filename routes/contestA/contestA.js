'use strict';
(require('rootpath')());

var configs = require('config/index.js');

var async = require('async');
var User = require('libs/cassandra/user');
var ContestA = require('libs/contestA/exports');
var FormatBets = ContestA.FormatBets;
var UpdateBet = ContestA.UpdateBet;

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

/*
 * ====================================================================
 * Bets
 * ====================================================================
 */
//no chance of errors
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
  function(result) {
    res.send({
      pending: result[0],
      pendingHash: FormatBets.getPendingBetsHash(),
      resell: result[1],
      resellHash: FormatBets.getResellBetsHashes()
    });
  });
}

//support for looking at other user's stuff?
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
  function(results) {
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

function getAthleteBets(req, res) {
  async.parallel(
  [
    function(callback) {

    },
    function(callback) {

    }
  ],
  function(results) {

  });
}

/*
 * ====================================================================
 * EXPORTS
 * ====================================================================
 */

exports.renderMarketHome = renderMarketHome;
exports.renderPortfolio = renderPortfolio;