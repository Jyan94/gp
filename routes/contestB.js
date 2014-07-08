'use strict';
(require('rootpath')());

var configs = require('config/index.js');

var async = require('async');
var User = require('libs/cassandra/user');
var ContestB = require('libs/cassandra/contestB/exports');
var modes = require('libs/contestB/modes.js');
var cql = configs.cassandra.cql;

var messages = configs.constants.contestStrings;

/*
 * ====================================================================
 * CONTEST TABLES
 * ====================================================================
 */

var renderContestPage = function (req, res, next) {
  res.render('contestB.hbs');
}

/*
 * ====================================================================
 * SEND CONTEST TABLES
 * ====================================================================
 */

var findContests = function (req, res, next, callback) {
  ContestB.selectOpen(function (err, result) {
    if (err) {
      res.send(500, 'Database error.');
    }
    else {
      callback(null, req, res, next, result);
    }
  });
}

var filterFunctionContestants = function(username, contest, callback) {
  async.map(Object.keys(contest.contestants),
    function(key, callback) {
      var contestant = { username: key,
                         instanceCount: JSON.parse(contest.contestants[key]).instances.length,
                       }

      callback(null, contestant);
    }, function (err, result) {
      callback(err, JSON.parse(contest.contestants[username]).instances, contest, result);
    });
}

var filterFunctionMain = function(userContestantInstances, contest, contestants, callback) {
  callback(
    null, 
    { 
      contestId: contest.contest_id,
      sport: contest.sport,
      type: contest.contest_name,
      contestStartTime: contest.contest_start_time,
      currentEntries: contest.current_entries,
      maximumEntries: contest.maximum_entries,
      entryFee: contest.entry_fee,
      totalPrizePool: contest.total_prize_pool,
      startingVirtualMoney: contest.starting_virtual_money,
      entriesAllowedPerContestant: contest.entries_allowed_per_contestant,
      games: contest.games,
      maxWager: contest.max_wager,
      payOuts: contest.pay_outs,
      contestants: contestants,
      userContestantInstances: userContestantInstances
    });
}

var filterFunction = function (username) {
  return function (contest, callback) {
    async.waterfall([
      function (callback) {
        callback(null, username, contest);
      },
      filterFunctionContestants,
      filterFunctionMain
    ], function (err, result) {
      callback(err, result);
    });
  };
}

var filterContestFieldsTables = function (req, res, next, contests, callback) {
  async.map(contests, filterFunction(req.user.username), function (err, result) {
    if (err) {
      res.send(500, 'Server error.');
    }
    else {
      res.send(JSON.stringify(result));
      /*res.render('tournamentTables.hbs', { link: 'login',
                                           display: 'Login',
                                           tournaments: result });*/
    }
  });
}

/*
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
*/

var sendContestTable = function (req, res, next) {
  async.waterfall([
    function (callback) {
      callback(null, req, res, next);
    },
    findContests,
    filterContestFieldsTables
  ],
  function (err) {
    if (err) {
      next(err);
    }
  });
}

/*
 * ====================================================================
 * CONTEST CREATION
 * ====================================================================
 */

var renderContestCreationPage = function (req, res, next) {
  
}

/*
 * ====================================================================
 * CONTEST ENTRY
 * ====================================================================
 */

var findContestByContestIdCheck = function (req, res, next, callback) {
  ContestB.selectById(req.params.contestId, function (err, result) {
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
var filterContestFieldsEntry = function (req, res, next, contest, callback) {
  var contestInfo = {};

  var parseAthlete = function(athlete, callback) {
    callback(null, JSON.parse(athlete));
  };

  async.map(contest.athletes, parseAthlete, function(err, result) {
    if (err) {
      res.send(500, 'Server error.');
    }
    else {
      contestInfo = { contestId: contest.contest_id,
                      athletes: result,
                      startingVirtualMoney: contest.starting_virtual_money
                    };

      res.render('contestBEntry.hbs', { link: 'logout',
                                          display: 'Logout',
                                          contestInfo: contestInfo });
    }
  });
}

var renderContestEntryPage = function (req, res, next) {
  if (typeof(req.params.contestId) === 'undefined') {
    res.send(404, 'Contest not found.');
  }
  else {
    async.waterfall([
      function (callback) {
        callback(null, req, res, next);
      },
      findContestByContestIdCheck,
      filterContestFieldsEntry
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
 * CONTEST ENTRY PROCESS
 * ====================================================================
 */

/*var entryProcessCheck = function (req, res, next, contest, callback) {
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
}*/

var findContestByContestId = function (req, res, next, callback) {
  ContestB.selectById(req.params.contestId, function (err, result) {
    if (err) {
      res.send(404, 'Contest not found.');
    }
    else {
      callback(null, req, res, next, result);
    }
  });
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

var submitEntry = function(req, res, next, contest, callback) {
  var user = req.user;
  var contestant = null;
  var instance = createInstance(req.body, contest);

  ContestB.addAndUpdateContestant(user, contest.contest_id, instance,
    function (err) {
      if (err) {
        next(err);
      }
      else {
        res.redirect('/contestB');
      }
    });
}

var contestEntryProcess = function (req, res, next) {
  if (typeof(req.params.contestId) === 'undefined') {
    res.send(404, 'Not a valid contest ID.');
  }
  else {
    async.waterfall([
      function (callback) {
        callback(null, req, res, next);
      },
      findContestByContestId,
      //entryProcessCheck,
      submitEntry
    ],
    function (err) {
      if (err) {
        next(err);
      }
    });
    /*submitEntry(req, res, next, function (err, result) {
      if (err) {
        next(err);
      }
    });*/
  }
}

/*
 * ====================================================================
 * EXPORTS
 * ====================================================================
 */

exports.renderContestPage = renderContestPage;
exports.sendContestTable = sendContestTable;
exports.renderContestCreationPage = renderContestCreationPage;
exports.renderContestEntryPage = renderContestEntryPage;
exports.contestEntryProcess = contestEntryProcess;
