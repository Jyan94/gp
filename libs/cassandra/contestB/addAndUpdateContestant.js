/**
 * ====================================================================
 * Author: Harrison Zhao
 * ====================================================================
 */
'use strict';
(require('rootpath')());

var UpdateContestant = require('./updateContestant');
var verifyInstance = UpdateContestant.verifyInstance;
var updateInstance = UpdateContestant.updateInstance;
var addUserInstanceToContest = 
  require('./addContestant').addUserInstanceToContest;
var removeInstanceFromContest = 
  require('./removeContestant').removeInstanceFromContest;
var SelectContest = require('./select');

var async = require('async');

/**
 * verifies and updates the instance
 * @param  {object}   user
 * from req.user
 * @param  {object}   contest
 * passed in from addUserInstanceToContest
 * is up to date with most recent addition to contest
 * @param  {int}   index
 * integer specifying which element of contestant instance
 * @param  {object}   instance
 * contestant instance object
 * @param  {Function} callback
 * args: (err)
 * first removes the instance from contestants if there's an error, does cleanup
 */
function verifyAndUpdateInstance(user, contest, index, instance, callback) {
  var verify = function(callback) {
    verifyInstance(user, index, instance, contest, callback);
  };

  var update = function(contest, callback) {
    updateInstance(user, index, instance, contest, callback);
  }

  var waterfallCallback = function(err) {
    if (err) {
      var errCallback = function(removeErr) {
        if (removeErr) {
          callback(removeErr);
        }
        else {
          callback(err);
        }
      };
      removeInstanceFromContest(user, contest, index, errCallback);
    }
    else {
      callback(null);
    }
  };

  async.waterfall(
  [
    verify,
    update
  ],
  waterfallCallback);
}

/**
 * adds a new contestant instance and updates the instance
 * @param  {object}   user
 * from req.user
 * @param {timeuuid}   contestId
 * sent from the front end
 * @param {object}   newInstance
 * instance sent from the front end
 * @param {Function} callback
 * args: (err)
 */
function addAndUpdateContestant(user, contestId, newInstance, callback) {
  async.waterfall(
  [
    function(callback) {
      SelectContest.selectById(contestId, callback);
    },
    function(contest, callback) {
      addUserInstanceToContest(user, contest, function(err, newInstanceIndex) {
        if (err) {
          callback(err);
        }
        else {
          callback(null, newInstanceIndex, contest);
        }
      });
    },
    function(index, contest, callback) {
      verifyAndUpdateInstance(user, contest, index, newInstance, callback);
    }
  ],
  callback);
}

exports.addAndUpdateContestant = addAndUpdateContestant;