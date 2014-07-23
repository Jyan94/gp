/**
 * ====================================================================
 * Author: Harrison Zhao
 * ====================================================================
 */
'use strict';
(require('rootpath')());

var async = require('async');
var configs = require('config/index.js');
var select = require('libs/contestA/formatBets.js');
var POLL_INTERVAL = configs.constants.pollInterval;

