/**
 * ====================================================================
 * Author: Harrison Zhao
 * ====================================================================
 */

'use strict';
(require('rootpath')());
var async = require('async');
var User = require('libs/cassandra/user');

/**
 * adds money back to user for a cancelled contest
 * whose contestants map not been JSON.parsed yet
 * @param  {object}   contest
 * read from database
 * @param  {Function} callback 
 * args: (err)
 */
function refundCancelledContestUsers(contest, callback) {
  async.each(Object.keys(contest.contestants),
    function(key, callback) {
      var numEntries = JSON.parse(contest.contestants[key]).instances.length;
      var refund = numEntries * contest.entry_fee;
      User.addMoneyToUserUsingUsername(refund, key, callback);
    },
    callback);
}

exports.refundCancelledContestUsers = refundCancelledContestUsers;