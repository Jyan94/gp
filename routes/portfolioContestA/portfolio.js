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
  res.render('portfolioContestA/portfolio.html');
}

function sendOverInitData(req, res, next) {
  var sendObj = {};
  async.waterfall(
  [
    function(callback) {
      async.parallel(
      [
        function(callback) {
          FormatBets.getUserTaken(callback);
        },
        function(callback) {
          FormatBets.getUserPending(callback);
        },
        function(callback) {
          FormatBets.getUserResell(callback);
        }
      ],
      function(err, results) {
        sendObj.taken = results[0];
        sendObj.pending = results[1];
        sendObj.resell = results[2];
        callback(null);
      });
    },
    function(callback) {
      async.reduce(
        sendObj.taken, 
        {index: 0, idToIndex: {}, athletes: []}, 
        function(memo, betObj, callback) {
          if (!memo.idToIndex[betObj.athleteId]) {
            memo.idToIndex[betObj.athleteId] = memo.index;
            memo.athletes.push(Athlete.Select.getByAthleteId(betObj.athleteId));
            ++memo.index;
          }
          callback(null, memo);
        }, 
        function(err, result) {
          if (err) {
            callback(err);
          }
          else {
            sendObj.takenAthletesList = result.athletes;
            sendObj.takenAthletesIdMap = result.idToIndex;
            callback(null);
          }
        });
    },
    function(callback) {
      async.map(
        sendObj.takenAthletesList,
        function(athlete, callback) {
          GetTimeseries.getByAthleteId(athlete.id, null, callback);
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

function renderGraph(req, res) {
  res.render('handlebarsPartials/contestAMultiTimeseries.html');
}

function getMultiTimeseries(req, res, next) {
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
exports.renderGraph = renderGraph;
exports.getMultiTimeseries = getMultiTimeseries;