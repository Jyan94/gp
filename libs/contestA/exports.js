/**
 * ====================================================================
 * Author: Harrison Zhao
 * ====================================================================
 */
'use strict';
require('rootpath')();

var FormatBets = require('./formatBets');
var ModifyBets = require('./modifyBets');
var UpdateGlobals = require('./updateGlobals');
var GetTimeseries = require('./getTimeseries');

//todo: documentation
exports.FormatBets = FormatBets;
exports.ModifyBets = ModifyBets;
exports.UpdateGlobals = UpdateGlobals;
exports.GetTimeseries = GetTimeseries;