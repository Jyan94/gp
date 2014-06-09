'use strict';
require('rootpath')();
var configs = require('config/index');

var cql = configs.cassandra.cql;
var client = configs.cassandra.client;

var async = require('async');

var Bet = require('libs/cassandra/bet.js');
var Player = require('libs/cassandra/player.js');
var TimeseriesBets = require('libs/cassandra/timeseriesBets');

var renderPlayerPage = function (req, res, next) {
  if (typeof(req.user) === 'undefined') {
    res.redirect('/login');
  }
  else {
    async.waterfall([
      function (callback) {
        var rows = null;
        var betInfo = [];

        Bet.selectUsingPlayerID('pending_bets', req.params.player_id, function(err, result) {
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

            callback(null, betInfo);
          }
        });
      },
      function(betInfo, callback) {
        var default_image = 'http://2.bp.blogspot.com/-6QyJDHjB5XE/Uscgo2DVBdI/AAAAAAAACS0/DFSFGLBK_fY/s1600/facebook-default-no-profile-pic.jpg';
        var full_name = null; 

        Player.select('player_id', req.params.player_id, function(err, result) {
          if (err) {
            next(err);
          }
          else {
            full_name = result.full_name;

            Player.selectImagesUsingPlayerName(full_name, function(err, result) {
              if (result.length === 0) {
                res.render('market', {betinfo: betInfo,
                  image_url: default_image,
                  player_id: req.params.player_id});
              }
              else {
                res.render('market', {betinfo: betInfo,
                  image_url: result[0].image_url,
                  player_id: req.params.player_id});
              }
            });
          }
        });
      }],
      function (err, arr) {
        if (err) {
          next(err);
        }
        else {
          return arr;
        }
      }
    );
  }
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

//post to '/addBets/:player_id'
var takeBet = function (req, res, next) {
  var bet_id = req.body.bet_id;
  var current_bet = null;
  var long_better_id = null;
  var short_better_id = null;

  Bet.selectMultiple('pending_bets', [bet_id], function(err, result) {
    if (err) {
      next(err);
    }
    else if (result.length === 0) {
      console.log('Bet Already Taken');
    }
    else {
      current_bet = result[0];

      //console.log(current_bet.long_position);

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
          var player_id = current_bet.player_id.split('-').join('');
          TimeseriesBets.insert(
            current_bet.player_id, 
            current_bet.bet_value, 
            function(err){
            if (err) {
              next(err);
            }
          });
        });
     }
  });
}

//exports above functions
exports.renderPlayerPage = renderPlayerPage;
exports.submitBet = submitBet;
exports.takeBet = takeBet;