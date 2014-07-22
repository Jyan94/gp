'use strict';
require('rootpath')();
var configs = require('config/index');

var cql = configs.cassandra.cql;
var client = configs.cassandra.client;

var async = require('async');

var Player = require('libs/cassandra/baseballPlayer.js');
var TimeseriesBets = require('libs/cassandra/timeseriesBets');
var mlbData = require('libs/mlbData.js');
var BaseballStatistics = require('libs/cassandra/baseballStatistics');

var messages = configs.constants.marketStrings;
var defaultImage = configs.constants.defaultPlayerImage;
var marketGlobals = configs.globals;
var pendingBets = marketGlobals.contestA.pendingBets;
var baseballAthletes = marketGlobals.athletes.Baseball.athletes;
var updateBet = require('libs/cassandra/contestA/updateBet.js')


var getDailyScores = function(req, res, next) {
  var date = new Date();
  var year = date.getFullYear();
  var month = date.getMonth() + 1;
  month = (month < 10 ? '0' : '') + month;
  var day = date.getDate();
  day = (day < 10 ? '0' : '') + day;

  var gameDate = '2014/07/13';
  //var gameDate = '' + year + '/' + month + '/' + day;
  console.log(gameDate);

  BaseballStatistics.selectGameUsingDate(gameDate, function(err, result) {
    if (err) {
      next(err);
    }
    else {
      res.render('marketHome', {result: result});
    }
  });
}

function getBetInfosFromAthleteId(params, user, callback) {
  async.filter(pendingBets, function(bet, callback) {
    callback(
      (params.athleteId === bet.athleteId) &&
      (user.username !== bet.seller));
  }, function(results) {
    callback(null, results);
  });
}

var renderAthletePage = function (req, res, next, callback) {
  getBetInfosFromAthleteId(req.params, req.user, function(bets) {
    var athlete = baseballAthletes[req.params.athleteId];
    if (athlete.athleteId) {
      res.render(
        'market',
        {
          bets: bets,
          imageUrl: athlete.athleteImage,
          athleteId: athlete.athleteId,
          athleteName: athlete.athleteName,
          athleteTeam: athlete.athleteTeam,
        });
    }
    else {
      callback(new Error('invalid athlete id'));
    }
  });
}
/*
//post to '/submitForm/:playerId'
var submitBet = function (req, res, next) {
  var betId = cql.types.timeuuid();
  var longPosition = null;

  if (req.body.longOrShort === 'Over') {
    longPosition = true;
  }
  else {
    longPosition = false;
  }
  Bet.insertPending(
    [
    betId,
    req.user.user_id,
    longPosition,
    req.params.playerId,
    {value: parseFloat(req.body.wagerAmount), hint: 'double'},
    {value: parseFloat(req.body.fantasyValue), hint: 'double'},
    null,
    null
    ],
    function(err){
      if (err) {
        res.send(500, { error: messages.databaseError });
      }
      else {
        Bet.subtractMoneyFromUser(parseFloat(req.body.wagerAmount) ,req.user.user_id, function(err) {
          if (err) {
            next(err);
          }
        })
          //SpendingPower.updateSpendingPower(req.user.user_id, req.user.money);
          //req.flash('info', messages.submitted);
          //res.redirect('/market/' + req.params.playerId)
      }
    });
}
*/

/**
 * [takeBet description]
 * @param  {[type]}   req      [description]
 * @param  {[type]}   res      [description]
 * @param  {Function} next     [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
var takeBet = function(req, res, next, callback) {
  updateBet.takePending(
    req.body,
    req.params.user_id,
    callback);

}

//exports above functions
exports.renderAthletePage = renderAthletePage;
exports.takeBet = takeBet;
exports.getDailyScores = getDailyScores;