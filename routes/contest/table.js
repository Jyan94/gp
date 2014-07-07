'use strict';
(require('rootpath')());

var async = require('async');
var configs = require('config/index.js');
var ContestBtable = require('libs/contestB/table');

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
function sendContestTable(req, res) {
  var contestBtables
}

exports.sendContestTable = sendContestTable;
exports.renderContestPage = renderContestPage;