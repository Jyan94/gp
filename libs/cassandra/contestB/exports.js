/**
 * ====================================================================
 * Author: Harrison Zhao
 * Date: 6/x/2014
 * See README.md for more information
 * ====================================================================
 */
'use strict';
var extend = require('node.extend');

var addAndUpdateContestant = require('./addAndUpdateContestant');
var removeContestant = require('./removeContestant');
var select = require('./select');
var update = require('./update');
var updateContestant = require('./updateContestant');
var timeseries = require('./timeseries');

/**
 * function signatures for adding, removing, and updating contestant instances
 * =============================================================================
 * @function removeContestantInstance(user, instanceIndex, contestId, callback)
 *
 * @param  {object}   user
 * from req.user, MUST have fields user_id and username
 * @param  {int}   instanceIndex 
 * index to be removed from instances
 * @param  {timeuuid}   contestId
 * id of contest
 * @param  {Function} callback      
 * args: (err)
 * 
 * =============================================================================
 * replaces the old contestant instance with the new contestant instance
 *
 * @function updateContestantInstance(user, 
 *                                    instanceIndex, 
 *                                    updatedInstance, 
 *                                    contestId, 
 *                                    callback)
 * @param  {object}   user            
 * user from req.user
 * @param  {int}   instanceIndex   
 * index of contestant instance 
 * @param  {object}   updatedInstance
 * updated instance for contestant as an object
 * @param  {timeuuid}   contestId       
 * @param  {Function} callback
 * args: (err)
 * 
 * =============================================================================
 * adds a new contestant instance and updates the instance
 * 
 * @function addAndUpdateContestant(user, contestId, newInstance, callback)
 * 
 * @param  {object}   user
 * from req.user
 * @param {timeuuid}   contestId
 * sent from the front end
 * @param {object}   newInstance
 * instance sent from the front end
 * @param {Function} callback
 * args: (err)
 */
exports.removeContestantInstance = removeContestant.removeContestantInstance;
exports.updateContestantInstance = updateContestant.updateContestantInstance;
exports.addAndUpdateContestant = addAndUpdateContestant.addAndUpdateContestant;

/**
 * timeseries namespace
 * module for inserting predicted values into timeseries_daily_prophet
 * =============================================================================
 * inserts prices into timeseries and sets it as an active prediction
 * 
 * @function insert(athleteId, 
 *                  fantasyValue, 
 *                  virtualMoneyWagered, 
 *                  username, 
 *                  callback)
 *                  
 * @param  {uuid}   athleteId
 * @param  {double}   fantasyValue
 * @param  {int}   virtualMoneyWagered
 * @param  {string}   username
 * username for user who made the prediction
 * @param  {Function} callback
 * args: (err)
 *
 * =============================================================================
 * removes all timeseries values associated with athleteId
 * 
 * @function removeValues(athleteId, callback)
 *
 * @param  {uuid}   athleteId
 * @param  {Function} callback
 * args: (err)
 *
 * =============================================================================
 * meant for directly sending to the frontend
 * returns a list of rows for fantasy values between two times: start and end
 *
 * @function selectTimeRange(athleteId, start, end, callback)
 * 
 * @param  {uuid}     athleteId
 * @param  {object}   start
 * Date Object
 * @param  {object}   end
 * Date Object
 * @param  {Function} callback  
 * args: (err, result)
 * where result is an array of rows
 *
 * =============================================================================
 * returns all rows for prices on a given player between start and now
 * 
 * @function selectSinceTime(athleteId, start, callback)
 *
 * @param  {uuid}     athleteId
 * @param  {object}   start
 * Date Object
 * @param  {Function} callback  
 * args: (err, result)
 * where result is an array
 * =============================================================================
 * selects all the active predictions for a given player
 * active refers to if the prediction was made for a contest not yet resolved
 * this is how the five-for-five determines which values are up to date
 * 
 * @function selectActivePlayerValues(athleteId, callback)
 * 
 * @param  {uuid}   athleteId
 * @param  {Function} callback
 * args: (err, result) where result is an array of values
 */
exports.timeseries = timeseries;

/**
 * for selecting
 * =============================================================================
 * @function selectById(contestId, callback)
 * 
 * @param  {timeuuid}   contestId
 * @param  {Function} callback
 * args: (err, result)
 * result is a row object
 * 
 * =============================================================================
 * @function selectByUsername(username, callback)
 * 
 * @param  {string}   username
 * @param  {Function} callback
 * args: (err, result)
 * result is a row object
 *
 * =============================================================================
 * select by state queries:
 * @param  {string} sport
 * @param  {Function} callback
 * args: (err, result)
 * result is an array of rows
 *
 * functions:
 * selectOpen
 * selectFilled
 * selectContestsToProcess
 * selectProcessed
 * selectCancelled
 *
 * =============================================================================
 * select by state range queries:
 * @param  {string} sport
 * @param  {Function} callback
 * args: (err, result)
 * result is an array of rows
 *
 * functions:
 * selectOpenToFilled
 * 
 * =============================================================================
 * @function selectBySport(sport, callback)
 * 
 * @param  {string}   sport
 * @param  {Function} callback
 * args: (err, results)
 * where results is an array of rows
 *
 * =============================================================================
 * returns all open contests with the given athlete name
 * 
 * @function selectOpenByAthlete(athleteName, callback)
 * 
 * @param  {string}   athleteName
 * @param  {Function} callback
 * args: (err, results)
 * where results is an array of rows
 * if there are no results, returns an empty array
 */
exports = extend(exports, select);

/**
 * for updating
 * =============================================================================
 * initialize contest by inserting into daily_prophet
 * fields that need type inference are formatted in function
 * 
 * @function insert(settings, callback)
 * 
 * @param  {array}   settings
 * contains array for daily_prophet entry initialization params
 * @param  {Function} callback
 * parameters (err)
 *
 * =============================================================================
 * @function delete(contestId, callback)
 * 
 * @param  {timeuuid} contestId
 * @param  {Function} callback
 * parameters (err)
 *
 * =============================================================================
 * update state queries
 * args: (contestId, callback)
 * @param  {timeuuid} contestId
 * @param  {Function} callback
 * parameters (err)
 *
 * functions:
 * setOpen
 * setFilled
 * setToProcess
 * setProcessed
 * setCancelled
 */
exports = extend(exports, update);