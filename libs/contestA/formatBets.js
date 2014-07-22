'use strict';
require('rootpath')();

var configs = require('configs/index');
var positions = configs.constants.contestA.POSITIONS;

var async = require('async');

var contestAGlobals = configs.globals.contestA;
var pendingBets = contestAGlobals.pendingBets;
var resellBets = contestAGlobals.resellBets;
var takenBets = contestAGlobals.takenBets;
var OVER = positions.OVER;
var UNDER = positions.UNDER;

function getUserPending(username, callback) {
  async.filter(pendingBets, function(bet, callback) {
    callback(bet.better === username);
  }, callback);
}

function getUserResell(username, callback) {
  async.filter(resellBets, function(bet, callback) {
    callback(
      (bet.isSellingPosition[OVER] && 
        bet.bettorUsernames[OVER] === username) ||
      (bet.isSellingPosition[UNDER] && 
        bet.bettorUsernames[UNDER] === username));
  }, callback);
}

function getUserTaken(username, callback) {
  async.filter(takenBets, function(bet, callback) {
    callback(
      (bet.isSellingPosition[OVER] && 
        bet.bettorUsernames[OVER] === username) ||
      (bet.isSellingPosition[UNDER] && 
        bet.bettorUsernames[UNDER] === username));
  }, callback);
}

function getPrimaryMarket(username, callback) {
  async.filter(pendingBets, function(bet, callback) {
    callback(bet.better !== username);
  }, callback);
}

function getSecondaryMarket(username, callback) {
  async.filter(resellBets, function(bet, callback) {    
    callback(
      bet.bettorUsernames[OVER] !== username && 
      bet.bettorUsernames[UNDER] !== username);
  }, callback);
}