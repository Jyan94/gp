'use strict';
(require('rootpath')());

var async = require('async');
var configs = require('config/index.js');
var ContestBtable = require('libs/contestB/table');
var POLL_INTERVAL = configs.constants.pollInterval;

var stringifiedCachedTables;
/*
 * ====================================================================
 * CONTEST TABLES
 * ====================================================================
 */
function renderContestPage(req, res) {
  res.render('contestB.hbs');
}

/*
 * ====================================================================
 * SEND CONTEST TABLES
 * ====================================================================
 */
function getCachedContests() {
  stringifiedCachedTables = JSON.stringify(ContestBtable.getContests());
}

setInterval(getCachedContests, POLL_INTERVAL);

function sendContestTable(req, res) {
  res.send(stringifiedCachedTables);
}

exports.sendContestTable = sendContestTable;
exports.renderContestPage = renderContestPage;