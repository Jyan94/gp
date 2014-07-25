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

function getUserPending(username, callback) {
  async.filter(pendingBets, function(bet, callback) {
    callback(bet.bettor === username);
  }, callback);
}

function getUserResell(username, callback) {
  async.filter(resellBets, function(bet, callback) {
    callback(bet.seller === username);
  }, callback);
}

function getUserTaken(username, callback) {
  async.filter(takenBets, function(bet, callback) {
    callback(bet.owner === username);
  }, callback);
}

function getPrimaryMarket(username, callback) {
  async.filter(pendingBets, function(bet, callback) {
    callback(bet.better !== username);
  }, callback);
}

function getSecondaryMarket(username, callback) {
  async.filter(resellBets, function(bet, callback) {
    callback(bet.seller !== username);
  }, callback);
}

function getMarketPendingByAthleteId(username, athleteId, callback) {
  async.filter(pendingBets, function(bet, callback) {
    callback(
      athleteId === bet.athleteId &&
      bet.bettor !== username);
  }, callback);
}

function getMarketResellByAthleteId(username, athleteId, callback) {
  async.filter(resellBets, function(bet, callback) {
    callback(
      bet.athleteId === athleteId &&
      bet.bettor !== username);
  });
}

exports.getUserPending = getUserPending;
exports.getUserResell = getUserResell;
exports.getUserTaken = getUserTaken;
exports.getPrimaryMarket = getPrimaryMarket;
exports.getSecondaryMarket = getSecondaryMarket;
exports.getMarketPendingByAthleteId = getMarketPendingByAthleteId;