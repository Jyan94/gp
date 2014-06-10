'use strict';
require('rootpath')();
var configs = require('config/index');

var cql = configs.cassandra.cql;
var client = configs.cassandra.client;

var async = require('async');

var Bet = require('libs/cassandra/bet.js');
var Player = require('libs/cassandra/player.js');
var TimeseriesBets = require('libs/cassandra/timeseriesBets');

var default_image = configs.constants.defaultPlayerImage;

var getBetInfosFromPlayerID = function (req, res, next, callback) {
  var rows = null;
  var betInfo = [];

  Bet.selectUsingPlayerID('pending_bets', req.params.player_id,
    function(err, result) {
      if (err) {
        next(err);
      }
      else {
        rows = result;

        for (var i = 0; i < rows.length; i++) {
          betInfo[i] = {
            bet_id: rows[i].bet_id,
            long_position: rows[i].long_position,
            bet_value: rows[i].bet_value,
            multiplier: rows[i].multiplier
          }
        }

        callback(null, req, res, next, betInfo);
      }
    });
}

var getImageFromPlayerID = function (req, res, next, betInfo, callback) {
  var full_name = null;
  var team;
  var position;

  Player.select('player_id', req.params.player_id, function(err, result) {
    if (err) {
      next(err);
    }
    else {
      full_name = result.full_name;
      team = result.team;
      position = result.position;

      Player.selectImagesUsingPlayerName(full_name, function(err, result) {
        if (result.length === 0) {
          res.render('market', {betinfo: betInfo,
            image_url: default_image,
            player_id: req.params.player_id,
            full_name: full_name,
            team: team,
            position: position});
        }
        else {
          res.render('market', {betinfo: betInfo,
            image_url: result[0].image_url,
            player_id: req.params.player_id,
            full_name: full_name,
            team: team,
            position: position});
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
    getBetInfosFromPlayerID,
    getImageFromPlayerID,
    ],
    function (err) {
      if (err) {
        next(err);
      }
    });
}

//post to '/submitForm/:player_id'
var submitBet = function (req, res, next) {
  var bet_id = cql.types.timeuuid();
  var long_position = null;

  if (req.body.longOrShort === 'Above') {
    long_position = true;
  }
  else {
    long_position = false;
  }

  if (typeof(req.user) === 'undefined') {
    res.redirect('/login');
  }
  else {
    Bet.insertPending([bet_id, req.user.user_id, long_position,
      req.params.player_id, {value: parseFloat(req.body.price), hint: 'double'},
      {value: parseFloat(req.body.shareNumber), hint: 'double'}, null, null],
      function(err){
        if (err) {
          next(err);
        }
        else {
          res.redirect('/market/' + req.params.player_id)
        }
      });
  }
}

var getBet = function (req, res, next, callback) {
  var bet_id = req.body.bet_id;

  Bet.selectMultiple('pending_bets', [bet_id],
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
  var current_bet = result[0];
  var long_better_id = null;
  var short_better_id = null;

  if (current_bet.long_position === 'true') {
    long_better_id = current_bet.user_id;
    short_better_id = req.user.user_id;
  }
  else {
    long_better_id = req.user.user_id;
    short_better_id = current_bet.user_id;
  }

  Bet.insertCurrent(req.user.user_id, [current_bet.bet_id, long_better_id,
    short_better_id, current_bet.player_id,
    {value: parseFloat(current_bet.bet_value), hint: 'double'},
    {value: parseFloat(current_bet.multiplier), hint: 'double'},
    current_bet.game_id, current_bet.expiration],
    function (err) {
      if (err) {
        next(err);
      }
      else {
        TimeseriesBets.insert(current_bet.player_id,
          parseFloat(current_bet.bet_value),
          function(err){
            if (err) {
              next(err);
          }
        });
      }
    });
}

//post to '/addBets/:player_id'
var takeBet = function (req, res, next) {
  var bet_id = req.body.bet_id;
  var current_bet = null;
  var long_better_id = null;
  var short_better_id = null;

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