'use strict';
(require('rootpath')());

var configs = require('config/index.js');

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
  if (typeof(req.user) === 'undefined') {
    res.redirect('/login');
  }

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

var findTournamentByContestIdCheck = function (req, res, next, callback) {
  Tournament.selectById(req.params.contestId, function (err, result) {
    if (err) {
      res.send(404, 'Contest not found.');
    }
    else if (result.maximum_entries === result.current_entries) {
      res.send(400, 'Contest is at maximum capacity.');
    }
    else if ((new Date()).getTime() > result.contest_deadline_time.getTime()) {
      res.send(400, 'Contest is past deadline time.');
    }
    else {
      callback(null, req, res, next, result);
    }
  });
}

// Need names, not numbers, as keys of athletes
var filterTournamentFieldsEntry = function (req, res, next, tournament, callback) {
  var contestInfo = { contestId: tournament.contest_id,
                      athletes: tournament.athletes,
                      startingVirtualMoney: tournament.starting_virtual_money
                    };

  var parseAthlete = function(athlete, callback) {
    console.log(athlete);
    callback(null, JSON.parse(athlete));
  }

  async.map(contestInfo.athletes, parseAthlete, function(err) {
    if (err) {
      next(err);
    }
    else {
      console.log(typeof(contestInfo.athletes[0]));

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
    }
  });
}

var renderTournamentEntryPage = function (req, res, next) {
  if (typeof(req.params.contestId) === 'undefined') {
    res.send(404, 'Contest not found.');
  }
  else if (typeof(req.user) === 'undefined') {
    res.redirect('/login');
  }
  else {
    async.waterfall([
      function (callback) {
        callback(null, req, res, next);
      },
      findTournamentByContestIdCheck,
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

var entryProcessCheck = function (req, res, next, contest, callback) {
  var user = req.user;
  var contestant = null;

  if (contest.contestants && contest.contestants.hasOwnProperty(user.username)){
    contestant = JSON.parse(contest.contestants[user.username]);
  }

  if (user.money < contest.entry_fee) {
    res.send(400, 'You do not have enough money to enter this contest.');
  }
  else if (contestant && contestant.instances.length === 
          contest.entries_allowed_per_contestant) {
    res.send(400, 'You have exceeded the maximum number of entries for a user');
  }
  else {
    callback(null, req, res, next, contest, user, contestant);
  }
}

var createInstance = function (params, contest) {
  var virtualMoneyRemaining = contest.starting_virtual_money;
  var wagers = [];
  var predictions = [];
  var time = new Date();

  for (var i = 0; i < contest.athletes.length; i++) {
    wagers[i] = parseInt(params['wager-' + i.toString()]);
    predictions[i] = parseInt(params['prediction-' + i.toString()]);
    virtualMoneyRemaining -= parseInt(params['wager-' + i.toString()]); 
  }

  return { virtualMoneyRemaining: virtualMoneyRemaining,
           wagers: wagers,
           predictions: predictions,
           lastModified: time,
           joinTime: time
         }

}

var submitEntry = function(req, res, next, contest, user, contestant, callback) {
  var instanceIndex = (contestant ? contestant.instances.length : 0);
  var instance = createInstance(req.body, contest);

  Tournament.addContestant(user, contest.contest_id, function (err, result) {
    if (err) {
      next(err);
    }
    else {
      Tournament.updateContestantInstance(user, instanceIndex,
        instance, contest.contest_id,
        function (err, result) {
          if (err) {
            next(err);
          }
          else {
            res.redirect('/tournaments');
          }
        });
    }
  });
}

var tournamentEntryProcess = function (req, res, next) {
  if (typeof(req.params.contestId) === 'undefined') {
    res.send(404, 'Not a valid contest ID.');
  }
  else if (typeof(req.user) === 'undefined') {
    res.redirect('/login');
  }
  else {
    async.waterfall([
      function (callback) {
        callback(null, req, res, next);
      },
      findTournamentByContestIdCheck,
      entryProcessCheck,
      submitEntry
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

exports.renderTournamentTablesPage = renderTournamentTablesPage;
exports.renderTournamentEntryPage = renderTournamentEntryPage;
exports.tournamentEntryProcess = tournamentEntryProcess;