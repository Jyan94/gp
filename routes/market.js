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
var SpendingPower = require('libs/calculateSpendingPower');

var messages = configs.constants.marketStrings;
var defaultImage = configs.constants.defaultPlayerImage;
var marketGlobals = configs.globals.contestA;
var pendingBets = marketGlobals.pendingBets;
var baseballAthletes = marketGlobals.athletes.Baseball.athletes;


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

  var athleteId = req.params.athleteId;
  var fullName = null;
  var team;
  var position;

  Player.select(athleteId, function(err, result) {
    if (err) {
      next(err);
    }
    else {
      fullName = result.full_name;
      team = result.team;
      position = result.position;

      Player.selectImagesUsingPlayerName(fullName, function(err, result) {
        if (result.length === 0) {
          res.render('market', {betinfo: betInfo,
            imageUrl: defaultImage,
            athleteId: athleteId,
            fullName: fullName,
            team: team,
            position: position});
        }
        else {
          res.render('market', {betinfo: betInfo,
            imageUrl: result[0].image_url,
            athleteId: athleteId,
            fullName: fullName,
            team: team,
            position: position});
        }
      });
    }
  });
}

var renderAthletePage = function (req, res, next) {
  getBetInfosFromAthleteId(req.params, req.user, function(bets) {
    athlete = baseballAthletes[req.params.athleteId];
    if (athleteId) {
      res.render(
        'market',
        {
          bets: bets,
          imageUrl: athleteImage
          athleteId: athlete.athleteId,
          athleteName: athlete.athleteName,
          athleteTeam: athlete.athleteTeam,
        });
    }
    else {
      callback(new Error('invalid athlete id'));
    }
  });
  async.waterfall([
    function(callback) {
      getBetInfosFromPlayerId(req.params, req.user, callback),
    },
    function(bets, callback) {

    }
    getImageFromPlayerId,
    ],
    function (err) {
      if (err) {
        next(err);
      }
    });
}

//post to '/submitForm/:athleteId'
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
    req.params.athleteId,
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
          //res.redirect('/market/' + req.params.athleteId)
      }
    });
}

var getBet = function (req, res, next, callback) {
  var betId = req.body.betId;

  Bet.selectMultiple('pending_bets', [betId],
    function(err, result) {
      if (err) {
        res.send(500, { error: messages.databaseError });
      }
      else if (result.length === 0) {
        res.send(400, { error: messages.betAlreadyTakenError });
      }
      else {
        callback(null, req, res, next, result);
      }
    });
}

var insertBet = function (req, res, next, result, callback) {
  var currentBet = result[0];
  var longBetterId = null;
  var shortBetterId = null;

  if (req.user.user_id === currentBet.user_id) {
    res.send(400, { error: messages.betTakerError });
  }
  else {
    if (currentBet.long_position === 'true') {
      longBetterId = currentBet.user_id;
      shortBetterId = req.user.user_id;
    }
    else {
      longBetterId = req.user.user_id;
      shortBetterId = currentBet.user_id;
    }
    Bet.insertCurrent(req.user.user_id, [currentBet.bet_id, longBetterId,
    shortBetterId, currentBet.athlete_id,
    {value: parseFloat(currentBet.wager), hint: 'double'},
    {value: parseFloat(currentBet.bet_value), hint: 'double'},
    currentBet.game_id, currentBet.expiration],
    function (err) {
      if (err) {
        res.send(500, { error: messages.databaseError });
      }
      else {
        TimeseriesBets.insert(currentBet.athlete_id,
          parseFloat(currentBet.bet_value),
          function(err){
          if (err) {
            res.send(500, { error: messages.databaseError });
          }
          else {
            Bet.subtractMoneyFromUser(parseFloat(currentBet.wager), req.user.user_id, function(err) {
              if (err) {
                next(err);
              }
              else {
                res.send('Bet taken successfully.');
              }
            });
          }
        });
      }
    });
  }
}

//post to '/addBets/:athleteId'
var takeBet = function (req, res, next) {
  var currentBet = null;
  var longBetterId = null;
  var shortBetterId = null;

  async.waterfall([
    function (callback) {
      callback(null, req, res, next);
    },
    getBet,
    insertBet
    ],
    function (err) {
      if (err) {
        next(err);
      }
    });
}

//exports above functions
exports.renderPlayerPage = renderPlayerPage;
exports.submitBet = submitBet;
exports.takeBet = takeBet;
exports.getDailyScores = getDailyScores;