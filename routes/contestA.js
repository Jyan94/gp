'use strict';
(require('rootpath')());

var configs = require('config/index.js');

var async = require('async');
var User = require('libs/cassandra/user');
var ContestB = require('libs/cassandra/contestB/exports');
var BaseballPlayer = require('libs/cassandra/baseball/player');
var Game = require('libs/cassandra/baseball/game');
var modes = require('libs/contestB/modes.js');
var calculate = require('libs/contestB/baseballCalculations.js');
var cql = configs.cassandra.cql;
var childProcess = require('child_process');
var cancel = require('libs/contestB/cancel.js');

var messages = configs.constants.contestStrings;
var contestBSizesNormal = configs.constants.contestBSizesNormal;
var scriptNames = configs.constants.scriptNames;

/*
 * ====================================================================
 * PORTFOLIO
 * ====================================================================
 */

var renderPortfolio = function (req, res, next) {
  res.render('portfolio.hbs');
}

/*
 * ====================================================================
 * EXPORTS
 * ====================================================================
 */

exports.renderPortfolio = renderPortfolio;