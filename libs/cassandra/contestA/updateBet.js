'use strict';
(require('rootpath')());

var configs = require('config/index.js');
var cql = configs.cassandra.cql;
var async = require('async');
var User = require('libs/cassandra/user');
var UpdateBet = require('libs/cassandra/contestA/update');

var constants = configs.constants;
var APPLIED = constants.cassandra.APPLIED;

//need to verify gameId and athlete in game!!!
function verifyGameIdAndAthlete(
  athleteId,
  athleteName,
  athleteTeam,
  gameId,
  sport,
  callback) {

  callback(null);
}

/**
  info fields:

  athleteId,
  athleteName,
  athleteTeam,
  expirationTimeMinutes,
  fantasyValue,
  gameId,
  isOverBetter,
  sport,
  wager
 * [insertPending description]
 * @param  {object}   info
 * @param  {object}   user
 * from req.user, must have username field
 * @param  {Function} callback
 * args: err
 */
function insertPending(info, user, callback) {

  async.waterfall(
  [
    function(callback) {
      verifyGameIdAndAthlete(
        info.athleteId,
        info.athleteName,
        info.athleteTeam,
        info.gameId,
        info.sport,
        callback);
    },
    function(callback) {
      User.subtractMoney(user.money, info.wager, user.user_id, callback);
    },
    function(callback) {
      UpdateBet.insertPending(
        info.athleteId,
        info.athleteName,
        info.athleteTeam,
        cql.types.timeuuid(),
        info.expirationTimeMinutes,
        info.fantasyValue,
        info.gameId,
        info.isOverBetter,
        info.sport,
        user.username,
        info.wager,
        callback);
    }
  ], callback);
}
//betId, isOverNotUnder, wager,
/**
 * info has fields
 * betId, isOverNotUnder, wager
 * @param  {object}   info
 * @param  {Function} callback
 * args: (err)
 */
function takePending(info, user, callback) {
  var takePendingCallback = function(err) {
    if (err && err.message === APPLIED) {
      User.addMoney(
        user.money - info.wager,
        info.wager,
        user.user_id,
        function(err) {
          if (err) {
            callback(err);
          }
          else {
            callback(new Error('bet has already been taken'));
          }
        });
    }
    else if (err) {
      callback(err);
    }
    else {
      callback(null);
    }
  };

  async.waterfall(
  [
    function(callback) {
      User.subtractMoney(user.money, info.wager, user.user_id, callback);
    },
    function(callback) {
      UpdateBet.takePending(
        info.betId,
        user.username,
        info.isOverNotUnder,
        info.wager,
        takePendingCallback);
    },
    function(callback) {

    }
  ], callback);
}

