'use strict';
require('rootpath')();
var configs = require('config/index');

var cql = configs.cassandra.cql;
var client = configs.cassandra.client;

var async = require('async');

var Bet = require('libs/cassandra/bet.js');
var Player = require('libs/cassandra/player.js');
var TimeseriesBets = require('libs/cassandra/timeseriesBets');

var defaultImage = configs.constants.defaultPlayerImage;

var getBetInfosFromPlayerId = function (req, res, next, callback) {
  var rows = null;
  var betInfo = [];

  Bet.selectUsingPlayerId('pendingBets', req.params.playerId,
    function(err, result) {
      if (err) {
        next(err);
      }
      else {
        rows = result;
        
        for (var i = 0; i < rows.length; i++) {
          betInfo[i] = {
            betId: rows[i].betId,
            longPosition: rows[i].longPosition,
            betValue: rows[i].betValue,
            multiplier: rows[i].multiplier
          }
        }

        callback(null, req, res, next, betInfo);
      }
    });
}

var getImageFromPlayerId = function (req, res, next, betInfo, callback) {
  var fullName = null; 

  Player.select(req.params.playerId, function(err, result) {
    if (err) {
      next(err);
    }
    else {
      fullName = result.fullName;

      Player.selectImagesUsingPlayerName(fullName, function(err, result) {
        if (result.length === 0) {
          res.render('market', {betInfo: betInfo,
            imageUrl: defaultImage,
            playerId: req.params.playerId});
        }
        else {
          res.render('market', {betInfo: betInfo,
            imageUrl: result[0].imageUrl,
            playerId: req.params.playerId});
        }
      });
    }
  });
}

var renderPlayerPage = function (req, res, next) {
  async.waterfall([
    function (callback) {
      callback(null, req, res, next);
    },
    getBetInfosFromPlayerId,
    getImageFromPlayerId,
    ],
    function (err) {
      if (err) {
        next(err);
      }
    });
}

//post to '/submitForm/:playerId'
var submitBet = function (req, res, next) {
  var betId = cql.types.timeuuid();
  var longPosition = null;

  if (req.body.longOrShort === 'Above') {
    longPosition = true;
  }
  else {
    longPosition = false;
  }

  if (typeof(req.user) === 'undefined') {
    res.redirect('/login');
  }
  else {
    Bet.insertPending([betId, req.user.userId, longPosition, 
      req.params.playerId, {value: parseFloat(req.body.price), hint: 'double'},
      {value: parseFloat(req.body.shareNumber), hint: 'double'}, null, null],
      function(err){
        if (err) {
          next(err);
        }
        else {
          res.redirect('/market/' + req.params.playerId)
        }
      });
  }
}

var getBet = function (req, res, next, callback) {
  var betId = req.body.betId;

  Bet.selectMultiple('pendingBets', [betId],
    function(err, result) {
      if (err) {
        next(err);
      }
      else if (result.length === 0) {
        console.log('Bet Already Taken');
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

  if (currentBet.longPosition === 'true') {
    longBetterId = currentBet.userId;
    shortBetterId = req.user.userId;
  }
  else {
    longBetterId = req.user.userId;
    shortBetterId = currentBet.userId;
  }

  Bet.insertCurrent(req.user.userId, [currentBet.betId, longBetterId,
    shortBetterId, currentBet.playerId,
    {value: parseFloat(currentBet.betValue), hint: 'double'},
    {value: parseFloat(currentBet.multiplier), hint: 'double'},
    currentBet.gameId, currentBet.expiration],
    function (err) {
      if (err) {
        next(err);
      }
      else {
        TimeseriesBets.insert(currentBet.playerId, 
          parseFloat(currentBet.betValue), 
          function(err){
            if (err) {
              next(err);
          }
        });
      }
    });
}

//post to '/addBets/:playerId'
var takeBet = function (req, res, next) {
  var betId = req.body.betId;
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