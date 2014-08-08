'use strict';
(require('rootpath')());

var configs = require('config/index.js');

var async = require('async');
var ContestA = require('libs/contestA/exports');
var FormatBets = ContestA.FormatBets;
var ModifyBets = ContestA.ModifyBets;
var GetTimeseries = ContestA.GetTimeseries;
var Athlete = require('libs/athletes/exports');

/*
 * ====================================================================
 * PORTFOLIO
 * ====================================================================
 */

function renderPortfolio(req, res) {
  res.render('portfolioContestA/portfolio.hbs');
}

function getAthletesFromBets(betArr, callback) {
  async.reduce(
    betArr, 
    {index: 0, idToIndex: {}, athletes: []}, 
    function(memo, betObj, callback) {
      if (betObj && !memo.idToIndex[betObj.athleteId]) {
        memo.idToIndex[betObj.athleteId] = memo.index;
        memo.athletes.push(Athlete.Select.getAthleteById(betObj.athleteId));
        ++memo.index;
      }
      callback(null, memo);
    }, 
    function(err, result) {
      if (err) {
        callback(err);
      }
      else {
        callback(null, {
          athletesArr: result.athletes,
          athletesIdMap: result.idToIndex
        });
      }
    });
}

function sendOverInitData(req, res, next) {
  var sendObj = {};
  sendObj.data = {
    takenBets: [],
    takenAthletesList: [],
    takenAthletesIdMap: {},
    pendingBets: [],
    pendingAthletesList: [],
    pendingAthletesIdMap: {},
    resellBets: [],
    resellAthletesList: [],
    resellAthletesIdMap: {}
  };
  sendObj.timeseries = [];
  async.waterfall(
  [
    function(callback) {
      var filterNulls = function(arr, callback) {
        async.filter(arr, function(item, callback) {
          callback(item);
        }, callback);
      } 
      async.parallel(
      [
        function(callback) {
          FormatBets.getUserTaken(req.user.username, callback);
        },
        function(callback) {
          FormatBets.getUserPending(req.user.username, callback);
        },
        function(callback) {
          FormatBets.getUserResell(req.user.username, callback);
        }
      ],
      callback);
    },
    function(results, callback) {
      async.map(results, function(arr, callback) {
        async.filter(arr, function(item, callback) {
          callback(item);
        }, function(results) {
          callback(null, results);
        });
      }, function (err, results) {
        sendObj.data.takenBets = results[0] || [];
        sendObj.data.pendingBets = results[1] || [];
        sendObj.data.resellBets = results[2] || [];
        callback(null);
      });
    },
    function(callback) {
      async.parallel(
      [
        function(callback) {
          getAthletesFromBets(sendObj.data.takenBets, function(err, results) {
            if (err) {
              callback(err);
            }
            else {
              sendObj.data.takenAthletesList = results.athletesArr;
              sendObj.data.takenAthletesIdMap = results.idToIndex;
              callback(null);
            }
          });
        },
        function(callback) {
          getAthletesFromBets(sendObj.data.pendingBets, function(err, results) {
            if (err) {
              callback(err);
            }
            else {
              sendObj.data.pendingAthletesList = results.athletesArr;
              sendObj.data.pendingAthletesIdMap = results.idToIndex;
              callback(null);
            }
          });
        },
        function(callback) {
          getAthletesFromBets(sendObj.data.resellBets, function(err, results) {
            if (err) {
              callback(err);
            }
            else {
              sendObj.data.resellAthletesList = results.athletesArr;
              sendObj.data.resellAthletesIdMap = results.idToIndex;
              callback(null);
            }
          });
        }
      ],
      function(err) {
        callback(null);
      });
    },
    function(callback) {
      async.map(
        sendObj.data.takenAthletesList,
        function(athlete, callback) {
          if (athlete) {
            GetTimeseries.getByAthleteId(athlete.id, null, callback);
          }
          else {
            callback(null, null);
          }
        },
        function(err, results) {
          if (err) {
            callback(err);
          }
          else {
            sendObj.timeseriesList = results;
            callback(null);
          }
        });
    }
  ],
  function(err) {
    if (err) {
      next(err);
    }
    else {
      res.send(sendObj);
    }
  });
}

function getMultiTimeseries(req, res, next) {
  req.query.timeUpdate = req.query.timeUpdate || 0;
  req.query.timeUpdate = parseInt(req.query.timeUpdate);
  req.query.athleteIds = req.query.athleteIds || [];
  async.map(req.query.athleteIds, function(id, callback) {
    GetTimeseries.getByAthleteId(id, req.query.timeUpdate, callback);
  }, function(err, results) {
    if (err) {
      next(err);
    }
    else {
      res.send(results);
    }
  });
}

exports.renderPortfolio = renderPortfolio;
exports.sendOverInitData = sendOverInitData;
exports.getMultiTimeseries = getMultiTimeseries;