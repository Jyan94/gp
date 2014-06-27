/**
 * ====================================================================
 * Author: Harrison Zhao
 * ====================================================================
 */
'use strict';
var extend = require('node.extend');

var addContestant = require('./addContestant');
var removeContestant = require('./removeContestant');
var select = require('./select');
var update = require('./update');
var updateContestant = require('./updateContestant');
var timeseries = require('./timeseries');

exports.addContestant = addContestant.addContestant;
exports.removeContestantInstance = removeContestant.removeContestantInstance;
exports.updateContestantInstance = updateContestant.updateContestantInstance;
exports.timeseries = timeseries;
exports = extend(exports, select);
exports = extend(exports, update);