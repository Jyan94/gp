'use strict';
(require('rootpath')());

var configs = require('config/index.js');

var async = require('async');
var User = require('libs/cassandra/user');
var ContestB = require('libs/cassandra/contestB/exports');
var BaseballPlayer = require('libs/cassandra/baseball/player');
var Game = require('libs/cassandra/baseball/game');
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
  ContestB.selectOpen('baseball', function (err, result) {
    if (err) {
      res.send(500, 'Database error.');
    }
    else {
      callback(null, req, res, next, result);
    }
  });
}

var filterContestFieldsTablesHelperContestants = function(username, contest, callback) {
  var contestants = contest.contestants;
  var contestantList = []

  if (contestants) {
    contestantList = Object.keys(contestants);

    async.map(contestantList,
      function(key, callback) {
        var contestant = { username: key,
                           instanceCount: JSON.parse(contestants[key]).instances.length,
                         }

        callback(null, contestant);
      }, function (err, result) {
        if (contestantList.indexOf(username) < 0) {
          callback(err, [], contest, result);
        }
        else {
          callback(err, JSON.parse(contestants[username]).instances, contest, result);
        }
      });
  }
  else {
    callback(null, [], contest, []);
  }
}

var filterContestFieldsTablesHelperMain = function(userContestantInstances, contest, contestants, callback) {
  callback(
    null, 
    {
      athletes: contest.athletes,
      contestants: contestants,
      contestId: contest.contest_id,
      contestStartTime: contest.contest_start_time,
      currentEntries: contest.current_entries,
      entriesAllowedPerContestant: contest.entries_allowed_per_contestant,
      entryFee: contest.entry_fee,
      games: contest.games,
      maximumEntries: contest.maximum_entries,
      maxWager: contest.max_wager,
      payouts: contest.payouts,
      sport: contest.sport,
      startingVirtualMoney: contest.starting_virtual_money,
      totalPrizePool: contest.total_prize_pool,
      type: contest.contest_name,
      userContestantInstances: userContestantInstances
    });
}

var filterContestFieldsTablesHelper = function (username) {
  return function (contest, callback) {
    async.waterfall([
      function (callback) {
        callback(null, username, contest);
      },
      filterContestFieldsTablesHelperContestants,
      filterContestFieldsTablesHelperMain
    ], function (err, result) {
      callback(err, result);
    });
  };
}

var filterContestFieldsTables = function (req, res, next, contests, callback) {
  async.map(contests, filterContestFieldsTablesHelper(req.user.username),
    function (err, result) {
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

var findEligibleGames = function (req, res, next, callback) {
  Game.selectTodaysGames(function (err, games) {
    if (err) {
      next(err);
    }
    else {
      callback(null, req, res, next, games);
    }
  });
}

var filterEligibleGamesHelperMain = function (player, callback) {
  BaseballPlayer.select(JSON.parse(player).athleteId,
    function (err, result) {
      if (err) {
        callback(err);
      }
      else {
        if (typeof(result) === 'undefined') {
          callback(null, null);
        }
        else {
          callback(
            null, 
            {
              playerId: result.player_id,
              fullName: result.full_name,
              shortTeamName: result.short_team_name,
              position: result.position
            });
        }
      }
    });
}

var filterEligibleGamesHelper = function (game, callback) {
  async.map(game.players, filterEligibleGamesHelperMain,
    function (err, result) {
      if (err) {
        callback(err);
      }
      else {
        async.filter(result,
          function (object, callback) { callback(object ? true : false) },
          function (result) {
            callback(
              null,
              {
                gameId: game.game_id,
                gameDate: game.game_date,
                longAwayName: game.long_away_name,
                longHomeName: game.long_home_name,
                players: result,
                shortAwayName: game.short_away_name,
                shortHomeName: game.short_home_name,
                startTime: game.start_time
              });
          });
      }
  });
}

var filterEligibleGames = function (req, res, next, games, callback) {
  async.map(games, filterEligibleGamesHelper,
    function (err, result) {
      if (err) {
        next(err);
      }
      else {
        res.render('contestBCreation.hbs', { link: 'logout',
                                             display: 'Logout',
                                             games: result });
      }
  });
}

var renderContestCreationPage = function (req, res, next) {
  async.waterfall([
    function (callback) {
      callback(null, req, res, next);
    },
    findEligibleGames,
    filterEligibleGames
    ],
    function (err, result) {
      if (err) {
        next(err);
      }
    });
}

/*
 * ====================================================================
 * CONTEST CREATION PROCESS
 * ====================================================================
 */

var removeDuplicatesContestCreation = function (req, res, next, callback) {
  var keys = Object.keys(req.body);

  if (keys.length === 0) {
    res.redirect('/contestB');
  }
  else {
    async.map(keys,
      function (elem, callback) {
        callback(null, elem.substring(49));
      },
      function (err, result) {
        if (err) {
          next(err);
        }
        else {
          var idArray = result;

          async.filter(keys,
            function (elem, callback) {
              callback(keys.indexOf(elem) === idArray.indexOf(elem.substring(49)) ? true : false);
            },
            function (result) {
              async.map(result,
                function (elem, callback) {
                  callback(null, elem.substring(49));
                },
                function (err, result) {
                  callback(err, req, res, next, result);
                });
            });
        }
      });
  }
}

var filterContestCreationGames = function (gameId, callback) {
  Game.select(gameId, function (err, game) {
    if (err) {
      callback(err);
    }
    else if (typeof(game) === 'undefined') {
      callback(null, null);
    }
    else {
      callback(null,
      {
        shortAwayTeam: game.short_away_name,
        longAwayTeam: game.long_away_name,
        awayTeamId: game.away_id,
        gameDate: game.start_time.getTime(),
        gameId: game.game_id,
        shortHomeTeam: game.short_home_name,
        longHomeTeam: game.long_home_name,
        homeTeamId: game.home_id,
      });
    }
  })
}

var getGamesForContestCreation = function (req, res, next, gameIdList, callback) {
  async.map(gameIdList, filterContestCreationGames,
    function (err, games) {
      callback(err, req, res, next, gameIdList, games);
    })
}

var filterContestCreationAthletes = function (gameIdList, games, keys) {
  return function (elem, callback) {
    var gameId = elem.substring(49);
    var gameContestId = gameIdList.indexOf(gameId);
    var game = games[gameContestId];
    var isOnHomeTeam = null;

    BaseballPlayer.select(elem.substring(7, 43),
      function (err, player) {
        if (err) {
          callback(err);
        }
        else {
          if (typeof(player) === 'undefined') {
            callback(null, null);
          }
          else {
            isOnHomeTeam = (player.short_team_name === game.short_home_name);
            callback(null,
              {
                athleteId: player.player_id,
                athleteName: player.full_name,
                athleteContestId: keys.indexOf(elem),
                gameContestId: gameContestId,
                gameId: game.game_id,
                isOnHomeTeam: isOnHomeTeam,
                longTeamName: player.long_team_name,
                longVersusTeamName: (isOnHomeTeam ? game.longAwayTeam : game.longHomeTeam),
                position: player.position,
                shortTeamName: player.short_team_name,
                shortVersusTeamName: (isOnHomeTeam ? game.awayTeam : game.homeTeam),
                teamId: player.team_id
              });
          }
        }
      });
  }
}

var getAthletesForContestCreation = function (req, res, next, gameIdList, games, callback) {
  var keys = Object.keys(req.body);

  async.map(keys, filterContestCreationAthletes(gameIdList, games, keys),
    function (err, players) {
      callback(err, req, res, next, games, players);
    });
}

var getDeadlineTimeForContestCreation = function (req, res, next, games, players, callback) {
  async.reduce(games, games[0].gameDate,
    function (memo, game, callback) {
      callback(null, game.gameDate < memo ? game.gameDate : memo);
    },
    function (err, deadlineTime) {
      callback(err, req, res, next, games, players, new Date(deadlineTime - 7200000));
    });
}


var submitContest = function (req, res, next, games, players, deadlineTime, callback) {
  var filterFunction = function (elem, callback) {
    callback(null, JSON.stringify(elem));
  }

  async.map(games, filterFunction,
    function (err, games) {
      if (err) {
        next(err);
      }
      else {
        var settings = modes.createTypeOne(players, games, deadlineTime, 'baseball');

        ContestB.insert(settings, function (err, result) {
          if (err) {
            next(err);
          }
          else {
            res.redirect('/contestB');
          }
        });
      }
    });
}

var contestCreationProcess = function (req, res, next) { 
  async.waterfall([
    function (callback) {
      callback(null, req, res, next);
    },
    removeDuplicatesContestCreation,
    getGamesForContestCreation,
    getAthletesForContestCreation,
    getDeadlineTimeForContestCreation,
    submitContest
  ],
  function (err) {
    if (err) {
      next(err);
    }
  });
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
    if (parseInt(params['wager-' + i.toString()])) {
      wagers[i] = parseInt(params['wager-' + i.toString()]);
    }
    else {
      wagers[i] = 0;
    }

    if (parseInt(params['prediction-' + i.toString()])) {
      predictions[i] = parseInt(params['prediction-' + i.toString()]);
    }
    else {
      predictions[i] = 0;
    }
    virtualMoneyRemaining -= wagers[i];
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
exports.contestCreationProcess = contestCreationProcess;
exports.renderContestEntryPage = renderContestEntryPage;
exports.contestEntryProcess = contestEntryProcess;
