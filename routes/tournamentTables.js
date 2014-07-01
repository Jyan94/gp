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

/*
 * ====================================================================
 * TOURNAMENT TABLES
 * ====================================================================
 */

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

var filterTournamentFieldsTables = function (req, res, next, tournaments, callback) {
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
    filterTournamentFieldsTables
  ],
  function (err) {
    if (err) {
      next(err);
    }
  });
}

/*
 * ====================================================================
 * TOURNAMENT ENTRY
 * ====================================================================
 */

var findTournamentByContestId = function (req, res, next, callback) {
  Tournament.selectById(req.params.contestId, function (err, result) {
    if (err) {
      next(err);
    }
    else {
      callback(null, req, res, next, result);
    }
  });
}

// Need names, not numbers, as keys of athletes
var filterTournamentFieldsEntry = function (req, res, next, tournament, callback) {
  /*var parseAthlete = function(athleteName, callback) {
    console.log(athleteName);
    tournament.athletes[athleteName] = JSON.parse(tournament.athletes[athleteName]);
    callback();
  }

  console.log(tournament.athlete_names)

  async.each(tournament.athlete_names, parseAthlete, function(err) {
    if (err) {
      next(err);
    }
    else {
      console.log(typeof(tournament.athletes[0]));
    }
  });*/
  
  var athlete = null;
  var athletes = [];
  var contestInfo = { contestId: tournament.contest_id,
                      athletes: athletes,
                      startingVirtualMoney: tournament.starting_virtual_money
                    };
    
  for (var i = 0; i < tournament.athlete_names.length; i++) {
    athlete = JSON.parse(tournament.athletes[i.toString()]);
    athletes[i] = athlete;
  }

  console.log(contestInfo);

  if (req.user) {
    res.render('tournamentEntry.hbs', { link: 'logout',
                                        display: 'Logout',
                                        contestInfo: contestInfo });
  }
  else {
    res.render('tournamentEntry.hbs', { link: 'login',
                                        display: 'Login',
                                        contestInfo: contestInfo });
  }

/*
  var contestInfo = { contestId: tournament.contest_id,
                      athletes: tournament.athletes,
                      startingVirtualMoney: tournament.starting_virtual_money
                    }
                      sport: tournament.sport,
                      type: 'The Daily Prophet',
                      contestStartTime: tournament.contest_start_time,
                      currentEntries: tournament.current_entries,
                      maximumEntries: tournament.maximum_entries,
                      entryFee: tournament.entry_fee,
                      totalPrizePool: tournament.total_prize_pool,
                      startingVirtualMoney: tournament.starting_virtual_money
                    };

  if (req.user) {
    console.log(contestInfo);
    res.render('tournamentEntry.hbs');
  }
  else {
    console.log(contestInfo);
    res.render('tournamentEntry.hbs');
  }*/
}

var renderTournamentEntryPage = function (req, res, next) {
  if (typeof(req.params.contestId) === 'undefined') {
    next(new Error('Not a valid contest ID.'));
  }
  else {
    async.waterfall([
      function (callback) {
        callback(null, req, res, next);
      },
      findTournamentByContestId,
      filterTournamentFieldsEntry
    ],
    function (err) {
      if (err) {
        next(err);
      }
    });
  }
}

/*
 * ====================================================================
 * TOURNAMENT ENTRY PROCESS
 * ====================================================================
 */

var parseEntry = function(req, res, next, callback) {
  
}

var tournamentEntryProcess = function (req, res, next) {
  if (typeof(req.params.contestId) === 'undefined') {
    next(new Error('Not a valid contest ID.'));
  }
  else {
    async.waterfall([
      function (callback) {
        callback(null, req, res, next);
      },
      findTournamentByContestId,
      filterTournamentFieldsEntry
    ],
    function (err) {
      if (err) {
        next(err);
      }
    });
  }
}

/*
 * ====================================================================
 * EXPORTS
 * ====================================================================
 */

app.get('/tournament', renderTournamentTablesPage);
app.get('/tournamentEntry/:contestId', renderTournamentEntryPage);
app.post('/tournamentEntryProcess/:contestId', tournamentEntryProcess);
app.listen(3000);