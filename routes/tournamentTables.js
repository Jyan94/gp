'use strict';
(require('rootpath')());

var express = require('express');
var app = module.exports = express();
var configs = require('config/index');
configs.configure(app);

var async = require('async');
var User = require('libs/cassandra/user');
var Tournament = require('libs/cassandra/dailyProphet/exports');
var modes = require('libs/dailyProphet/modes.js');
var cql = configs.cassandra.cql;

var messages = configs.constants.tournamentStrings;

var tournamentEntryProcess = function (req, res, next) {
  
}

var findTournaments = function (req, res, next, callback) {
  Tournament.selectOpen(function (err, result) {
    if (err) {
      next(err);
    }
    else {
      callback(null, req, res, next, result);
    }
  });
}

var filterTournamentFields = function (req, res, next, tournaments, callback) {
  var filterFunction = function (tournament, callback) {
    callback(null, { contestId: tournament.contest_id,
                     sport: tournament.sport,
                     type: 'The Daily Prophet',
                     contestStartTime: tournament.contest_start_time,
                     currentEntries: tournament.current_entries,
                     maximumEntries: tournament.maximum_entries,
                     entryFee: tournament.entry_fee,
                     totalPrizePool: tournament.total_prize_pool,
                     startingVirtualMoney: tournament.starting_virtual_money
                   });
  }

  async.map(tournaments, filterFunction, function (err, result) {
    console.log(JSON.stringify(result));
    if (err) {
      next(err);
    }
    else {
      if (req.user) {
        res.render('tournamentTables.hbs', { link: 'login',
                                             display: 'Login',
                                             tournaments: result });
      }
      else {
        res.render('tournamentTables.hbs', {link: 'logout',
                                            display: 'Logout',
                                            tournaments: result});
      }
    }
  });
}

var renderTournamentTablesPage = function (req, res, next) {
  async.waterfall([
    function (callback) {
      callback(null, req, res, next);
    },
    findTournaments,
    filterTournamentFields
  ],
  function (err) {
    if (err) {
      next(err);
    }
  });
}

var findTournamentByContestId = function (req, res, next) {
  Tournament.selectById()
}

var renderTournamentEntryPage = function (req, res, next) {
  async.waterfall([
    function (callback) {
      callback(null, req, res, next);
    },
    findTournaments
  ],
  function (err) {
    if (err) {
      next(err);
    }
  });

  if (req.user) {
    res.render('tournamentEntry.hbs');
  }
  else {
    res.render('tournamentEntry.hbs');
  }
}

app.get('/tournament', renderTournamentTablesPage);
app.get('/tournamentEntry/:contestId', renderTournamentEntryPage);
//app.post('/tournamentEntryProcess', tournamentEntryProcess);
app.listen(3000);