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

/*
IMPORTANT: READ!!!
send over all bets, if it's a bet user is not supposed to see,
such as a pending bet that was placed by the user,
replace the bet with null
FOR front-end: access object's keys and check if it's null
 */
//filter by sport on frontend
//filter by athlete on frontend
function getUserPending(username, callback) {
  async.map(contestAGlobals.pendingBets, function(bet, callback) {
    bet.bettor === username ? callback(null, bet) : callback(null, null);
  }, callback);
}

function getUserResell(username, callback) {
  async.map(contestAGlobals.resellBets, function(bet, callback) {
    bet.seller === username ? callback(null, bet) : callback(null, null);
  }, callback);
}

function getUserTaken(username, callback) {
  async.map(contestAGlobals.takenBets, function(bet, callback) {
    bet.owner === username ? callback(null, bet) : callback(null, null);
  }, callback);
}

function getPrimaryMarket(username, callback) {
  async.map(contestAGlobals.pendingBets, function(bet, callback) {
    bet.better !== username ? callback(null, bet) : callback(null, null);
  }, callback);
}

function getSecondaryMarket(username, callback) {
  async.map(contestAGlobals.resellBets, function(bet, callback) {
    bet.seller !== username ? callback(null, bet) : callback(null, null);
  }, callback);
}

function getMarketPendingByAthleteId(username, athleteId, callback) {
  async.map(contestAGlobals.pendingBets, function(bet, callback) {
      athleteId === bet.athleteId && bet.bettor !== username ? 
        callback(null, bet) : callback(null, null);
  }, callback);
}

function getMarketResellByAthleteId(username, athleteId, callback) {
  async.map(contestAGlobals.resellBets, function(bet, callback) {
      bet.athleteId === athleteId && bet.bettor !== username ? 
        callback(null, bet) : callback(null, null);
  });
}

function getPendingBetsHash() {
  return contestAGlobals.pendingBetIdToArrayIndex;
}

function getResellBetsHashes() {
  return {
    over: contestAGlobals.overResellBetIdToArrayIndex,
    under: contestAGlobals.underResellBetIdToArrayIndex
  };
}

function getTakenBetsHashes() {
  return {
    over: contestAGlobals.overTakenBetIdToArrayIndex,
    under: contestAGlobals.underTakenBetIdToArrayIndex
  };
}

exports.getUserPending = getUserPending;
exports.getUserResell = getUserResell;
exports.getUserTaken = getUserTaken;
exports.getPrimaryMarket = getPrimaryMarket;
exports.getSecondaryMarket = getSecondaryMarket;
exports.getMarketPendingByAthleteId = getMarketPendingByAthleteId;

exports.getPendingBetsHash = getPendingBetsHash;
exports.getResellBetsHashes = getPendingBetsHash;
exports.getTakenBetsHashes = getTakenBetsHashes;