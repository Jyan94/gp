/*
  file containing handlebars helpers
  exports.[helper name] = function(context, options) {
    //helper stuff here
  }
 */
'use strict';

var contestBHelpers = require('./contestBHelpers');
exports.contestBCreationHelperAway = contestBHelpers.contestBCreationHelperAway;
exports.contestBCreationHelperHome = contestBHelpers.contestBCreationHelperHome;
exports.contestBEntryHelper = contestBHelpers.contestBEntryHelper;
exports.contestBEditHelper = contestBHelpers.contestBEditHelper;