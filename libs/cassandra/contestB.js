'use strict';
(require('rootpath')());

/**
 * takes an array of fields to insert, must be in order of the query
 * @param  {array}   fields   [insert array fields]
 * @param  {Function} callback [description]
 * @return {null}            calls callback instead
 */
exports.insert = function(fields, callback) {

}

exports.delete = function(contestId, callback) {

}

exports.selectById = function(contestId, callback) {

}

exports.selectByUsername = function(username, callback) {

}

exports.selectCancelled = function(sport, callback) {

}

exports.selectOpenContests = function(sport) {

}
/**
 * first checks if tournament is full
 * checks if username is already in contest and if it is, appends another
 * newly initialized contestant instance
 * @param {[type]} username [description]
 */
exports.addContestant = function(username, contestId, callback) {

}

exports.removeContestant = function(
  contestantInstanceId, 
  username, 
  contestId,
  callback) {

}

exports.updateContestant = function(
  contestantInstanceObject,
  contestantInstanceIndex,
  username,
  contestId,
  callback) {

}