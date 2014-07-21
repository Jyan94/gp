'use strict';
(require('rootpath')());

var configs = require('config/index.js');
var async = require('async');
var User = require('libs/cassandra/user');
var UpdateBet = require('./update');

var constants = configs.constants;
var APPLIED = constants.cassandra.APPLIED;

//need to verify gameId!!!
function insertPending(
  athleteId,
  athleteName,
  athleteTeam,
  expirationTimeMinutes,
  fantasyValue,
  gameId, 
  wager,
  username,
  isOverBetter,
  callback) {

  async.waterfall(
  [

  ], callback);
}

function takePending(
  betId, user, isOverNotUnder, wager, callback) {

}