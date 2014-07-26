/**
 * ====================================================================
 * Author: Harrison Zhao
 * ====================================================================
 */
'use strict';
require('rootpath')();

var configs = require('config/index');
var async = require('async');

var contestAGlobals = configs.globals.contestA;
var pendingBets = contestAGlobals.pendingBets;
var resellBets = contestAGlobals.resellBets;
var takenBets = contestAGlobals.takenBets;

/*
IMPORTANT: READ!!!
send over all bets, if it's a bet user is not supposed to see,
such as a pending bet that was placed by the user,
replace the bet with null
 */
function getUserPending(username, callback) {
  async.map(pendingBets, function(bet, callback) {
    bet.bettor === username ? callback(null, bet) : callback(null, null);
  }, callback);
}

function getUserResell(username, callback) {
  async.map(resellBets, function(bet, callback) {
    bet.seller === username ? callback(null, bet) : callback(null, null);
  }, callback);
}

function getUserTaken(username, callback) {
  async.map(takenBets, function(bet, callback) {
    bet.owner === username ? callback(null, bet) : callback(null, null);
  }, callback);
}

function getPrimaryMarket(username, callback) {
  async.map(pendingBets, function(bet, callback) {
    bet.better !== username ? callback(null, bet) : callback(null, null);
  }, callback);
}

function getSecondaryMarket(username, callback) {
  async.map(resellBets, function(bet, callback) {
    bet.seller !== username ? callback(null, bet) : callback(null, null);
  }, callback);
}

function getMarketPendingByAthleteId(username, athleteId, callback) {
  async.map(pendingBets, function(bet, callback) {
      athleteId === bet.athleteId && bet.bettor !== username ? 
        callback(null, bet) : callback(null, null);
  }, callback);
}

function getMarketResellByAthleteId(username, athleteId, callback) {
  async.map(resellBets, function(bet, callback) {
      bet.athleteId === athleteId && bet.bettor !== username ? 
        callback(null, bet) : callback(null, null);
  });
}

exports.getUserPending = getUserPending;
exports.getUserResell = getUserResell;
exports.getUserTaken = getUserTaken;
exports.getPrimaryMarket = getPrimaryMarket;
exports.getSecondaryMarket = getSecondaryMarket;
exports.getMarketPendingByAthleteId = getMarketPendingByAthleteId;