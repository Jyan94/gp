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
var GetTimeseries = require('./GetTimeseries');

//todo: documentation
exports.FormatBets = FormatBets;
exports.ModifyBets = ModifyBets;
exports.UpdateGlobals = UpdateGlobals;
exports.GetTimeseries = GetTimeseries;