/**
 * ====================================================================
 * Author: Harrison Zhao
 * ====================================================================
 */

'use strict';
(require('rootpath')());
var async = require('async');
var User = require('libs/cassandra/user');

function refundCancelledContestUsers(contest, callback) {
  async.each(Object.keys(contest.contestants), function(key, callback) {
    if (contest.contestants.hasOwnProperty(key)) {
      var numEntries = JSON.parse(contest.contestants[key]).instances.length;
      var refund = numEntries * contest.entry_fee;
      User.addMoneyToUserUsingUsername(refund, key, callback);
    }
    else {
      callback(null);
    }
  }, callback);
}

exports.refundCancelledContestUsers = refundCancelledContestUsers;