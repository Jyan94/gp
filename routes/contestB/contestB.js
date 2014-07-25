'use strict';
(require('rootpath')());

var configs = require('config/index.js');

var async = require('async');
var User = require('libs/cassandra/user');
var ContestB = require('libs/cassandra/contestB/exports');
var BaseballPlayer = require('libs/cassandra/baseball/player');
var Game = require('libs/cassandra/baseball/game');
var modes = require('libs/contestB/modes.js');
var calculate = require('libs/contestB/baseballCalculations.js');
var cql = configs.cassandra.cql;
var childProcess = require('child_process');
var cancel = require('libs/contestB/cancel.js');

var contestBSizesNormal = configs.constants.contestB.SIZES_NORMAL;
var scriptNames = configs.constants.scriptNames;

/*
 * ====================================================================
 * CONTEST TABLES
 * ====================================================================
 */

var renderContestPage = function (req, res, next) {
  res.render('contestB/contests.hbs');
}

/*
 * ====================================================================
 * SEND CONTEST TABLES
 * ====================================================================
 */

var findContests = function (req, res, next, callback) {
  ContestB.selectOpen('Baseball', function (err, result) {
    if (err) {
      res.send(500, 'Database error.');
    }
    else {
      callback(null, req, res, next, result);
    }
  });
}

var filterContestFieldsTablesHelperContestants = function(
  username, 
  contest, 
  callback) {

  var contestants = contest.contestants;
  var contestantList = [];

  if (contestants) {
    contestantList = Object.keys(contestants);

    async.map(
      contestantList,
      function(key, callback) {

        var contestant = { 
          username: key,
          instanceCount: JSON.parse(contestants[key]).instances.length
        };
        callback(null, contestant);

      }, 
      function (err, result) {
        if (contestantList.indexOf(username) < 0) {
          callback(err, [], contest, result);
        }
        else {
          callback(
            err, 
            JSON.parse(contestants[username]).instances, 
            contest, 
            result);
        }
      });
  }
  else {
    callback(null, [], contest, []);
  }
}

var filterContestFieldsTablesHelperMain = function(
  userContestantInstances, 
  contest, 
  contestants, 
  callback) {

  callback(
    null, 
    {
      athletes: contest.athletes,
      contestants: contestants,
      contestId: contest.contest_id,
      contestDeadlineTime: contest.contest_deadline_time,
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
 * CONTEST INFO
 * ====================================================================
 */

var renderContestInfoPage = function (req, res, next) {
  res.render('contestB/info.hbs');
}

/*
 * ====================================================================
 * CONTEST CREATION
 * ====================================================================
 */

var findEligibleGames = function (req, res, next, callback) {
  var currentTime = (new Date()).getTime();

  Game.selectTodaysGames(function (err, games) {
    if (err) {
      next(err);
    }
    else {
      async.filter(games,
        function (game, callback) {
          callback((currentTime < game.start_time - 900000) ? true : false);
        },
        function (games) {
          callback(null, req, res, next, games);
        })
    }
  });
}

/* Uses the roster from the daily event info page of Sportsdata */

/*var filterEligibleGamesHelperMain = function (player, callback) {
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
              athleteId: result.athlete_id,
              fullName: result.full_name,
              shortTeamName: result.short_team_name,
              position: result.position
            });
        }
      }
    });
}

var filterEligibleGamesHelper = function (game, callback) {
  async.map(game.athletes ? game.athletes : [], filterEligibleGamesHelperMain,
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
                athletes: result,
                gameId: game.game_id,
                gameDate: game.game_date,
                longAwayName: game.long_away_name,
                longHomeName: game.long_home_name,
                shortAwayName: game.short_away_name,
                shortHomeName: game.short_home_name,
                startTime: game.start_time
              });
          });
      }
  });
}*/

/* Uses the short_team_name field of the baseball_player table */

var filterEligibleGamesHelperMain = function (shortTeamName) {
  return function (callback) {
    BaseballPlayer.selectUsingShortTeamName(shortTeamName,
      function (err, players) {
        if (err) {
          callback(err);
        }
        else {
          async.map(players,
            function (player, callback) {
              callback(
                null, 
                {
                  athleteId: player.athlete_id,
                  fullName: player.full_name,
                  shortTeamName: player.short_team_name,
                  position: player.position
                });
            },
            function (err, players) {
              callback(err, players);
            });
        }
      });
  };
}

var filterEligibleGamesHelper = function (game, callback) {
  async.parallel([
    filterEligibleGamesHelperMain(game.short_away_name),
    filterEligibleGamesHelperMain(game.short_home_name)
    ],
    function (err, result) {
      if (err) {
        callback(err);
      }
      else {
        callback(
          null,
          {
            athletes: result[0].concat(result[1]),
            gameId: game.game_id,
            gameDate: game.game_date,
            longAwayName: game.long_away_name,
            longHomeName: game.long_home_name,
            shortAwayName: game.short_away_name,
            shortHomeName: game.short_home_name,
            startTime: game.start_time
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
        res.render(
          'contestB/creation.hbs', 
          { 
            link: 'logout',
            display: 'Logout',
            games: result 
          });
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

var parseParamsContestCreation = function (req, res, next, callback) {
  var body = req.body;
  var keys = Object.keys(body);
  var params = {};

  if (keys.indexOf('is-fifty-fifty') < 0) {
    res.send(400, 'Need a value for fifty-fifty.');
  }
  else if (keys.indexOf('entry-fee') < 0) {
    res.send(400, 'Need a value for entry fee.');
  }
  else if (keys.indexOf('maximum-entries') < 0) {
    res.send(400, 'Need a value for maximum entries.');
  }
  else if (keys.indexOf('starting-virtual-money') < 0) {
    res.send(400, 'Need a value for starting virtual money.');
  }
  else {
    var isFiftyFifty = body['is-fifty-fifty'];
    var entryFee = Number(body['entry-fee']);
    var maximumEntries = Number(body['maximum-entries']);
    var startingVirtualMoney = Number(body['starting-virtual-money']);

    if (['true', 'false'].indexOf(isFiftyFifty) < 0) {
      res.send(400, 'Need a valid value for fifty-fifty.');
    }
    else if ((isNaN(entryFee)) || (entryFee < 0)
             || (entryFee > 1000) || (entryFee % 5 !== 0)) {
      res.send(400, 'Need a valid value for entry fee.');
    }
    else if ((isNaN(maximumEntries)) || 
            ((isFiftyFifty === 'true') && 
              ((maximumEntries < 3) || 
              (maximumEntries > 2001) || 
              (maximumEntries % 2 !== 1))) || 
            ((isFiftyFifty === 'false') && 
              (contestBSizesNormal.indexOf(maximumEntries) < 0))) {
      res.send(400, 'Need a valid value for maximum entries.');
    }
    else if ((isNaN(startingVirtualMoney)) || 
              (startingVirtualMoney < 1000) || 
              (startingVirtualMoney > 1000000) || 
              (startingVirtualMoney % 1000 !== 0)) {
      res.send(400, 'Need a valid value for starting virtual money.');
    }
    else {
      params.isFiftyFifty = (body['is-fifty-fifty'] === 'true' ? true : false);
      params.entryFee = Number(body['entry-fee']);
      params.maximumEntries = Number(body['maximum-entries']);
      params.startingVirtualMoney = Number(body['starting-virtual-money']);

      async.filter(
        keys,
        function (key, callback) {
          callback(
            (key.length === 85) && 
            (key.substring(0, 7) === 'player-') && 
            (key.substring(43, 49) === '-game-'));
        },
        function (result) {
          callback(null, req, res, next, params, result);
        });
    }
  }
}

//keys is an array with only the athlete checkbox values
//elem.substring(49) - gets element id from divs
var removeDuplicatesContestCreation = function (
  req, 
  res, 
  next, 
  params,
  keys, 
  callback) {

  if (keys.length < 2) {
    res.send(400, 'Need at least two athletes for contest creation.');
  }
  else {
    async.map(
      keys,
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
              callback(
                keys.indexOf(elem) === idArray.indexOf(elem.substring(49)));
            },
            function (result) {
              async.map(result,
                function (elem, callback) {
                  callback(null, elem.substring(49));
                },
                function (err, result) {
                  callback(err, req, res, next, params, keys, result);
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

var getGamesForContestCreation = function (
  req, 
  res, 
  next, 
  params, 
  keys,
  gameIdList, 
  callback) {

  async.map(gameIdList, filterContestCreationGames,
    function (err, games) {
      callback(err, req, res, next, params, keys, gameIdList, games);
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
            isOnHomeTeam = (player.short_team_name === game.shortHomeTeam);
            callback(null,
              {
                athleteId: player.athlete_id,
                athleteName: player.full_name,
                athleteContestId: keys.indexOf(elem),
                gameContestId: gameContestId,
                gameId: game.gameId,
                isOnHomeTeam: isOnHomeTeam,
                longTeamName: player.long_team_name,
                longVersusTeamName: 
                  (isOnHomeTeam ? game.longAwayTeam : game.longHomeTeam),
                position: player.position,
                shortTeamName: player.short_team_name,
                shortVersusTeamName: 
                  (isOnHomeTeam ? game.shortAwayTeam : game.shortHomeTeam),
                teamId: player.team_id
              });
          }
        }
      });
  }
}

var getAthletesForContestCreation = function (
  req, 
  res, 
  next, 
  params, 
  keys,
  gameIdList, 
  games, 
  callback) {

  async.map(
    keys, 
    filterContestCreationAthletes(gameIdList, games, keys),
    function (err, players) {
      callback(err, req, res, next, params, games, players);
    });
}

var getDeadlineTimeForContestCreation = function (
  req, 
  res, 
  next, 
  params,
  games, 
  players, 
  callback) {

  async.reduce(
    games, 
    games[0].gameDate,
    function (memo, game, callback) {
      callback(null, game.gameDate < memo ? game.gameDate : memo);
    },
    function (err, deadlineTime) {
      callback(
        err, 
        req, 
        res, 
        next, 
        params, 
        games, 
        players,
        new Date(deadlineTime - 900000));
    });
}


var submitContest = function (
  req, 
  res, 
  next, 
  params, 
  games, 
  players,
  deadlineTime, 
  callback) {

  var filterFunction = function (elem, callback) {
    callback(null, JSON.stringify(elem));
  }

  async.map(games, filterFunction,
    function (err, games) {
      if (err) {
        next(err);
      }
      else {        
        var settings = modes.createTypeOne(
          players, 
          games, 
          deadlineTime,
          params.entryFee,
          params.isFiftyFifty,
          params.maximumEntries,
          'Baseball',
          params.startingVirtualMoney);

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
    parseParamsContestCreation,
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

var findContestByContestIdCheckEntry = function (req, res, next, callback) {
  var currentTime = (new Date()).getTime();

  ContestB.selectById(req.params.contestId, function (err, result) {
    if (err) {
      res.send(404, 'Contest not found.');
    }
    else if (result.maximum_entries === result.current_entries) {
      res.send(400, 'Contest is at maximum capacity.');
    }
    else if (currentTime > result.contest_deadline_time.getTime()) {
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
      contestInfo = { 
        contestId: contest.contest_id,
        athletes: result,
        maxWager: contest.max_wager,
        startingVirtualMoney: contest.starting_virtual_money
      };

      res.render(
        'contestB/entry.hbs', 
        { 
          link: 'logout',
          display: 'Logout',
          contestInfo: contestInfo 
        });
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
      findContestByContestIdCheckEntry,
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

var findContestByContestIdEntry = function (req, res, next, callback) {
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
  var instance = createInstance(req.body, contest);

  ContestB.addAndUpdateContestant(
    req.user, 
    contest.contest_id, 
    instance,
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
      findContestByContestIdEntry,
      //entryProcessCheck,
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
 * CONTEST EDIT
 * ====================================================================
 */

var findContestByContestIdCheckEdit = function (req, res, next, callback) {
  var currentTime = (new Date()).getTime();

  ContestB.selectById(req.params.contestId, function (err, result) {
    if (err) {
      res.send(404, 'Contest not found.');
    }
    else if (currentTime > result.contest_deadline_time.getTime()) {
      res.send(400, 'Contest is past deadline time.');
    }
    else {
      callback(null, req, res, next, result, currentTime);
    }
  });
}

// Need names, not numbers, as keys of athletes
var filterContestFieldsEdit = function (
  req, 
  res, 
  next, 
  contest, 
  currentTime, 
  callback) {

  var contestantInstanceIndex = req.params.contestantInstanceIndex;
  var contestant = contest.contestants[req.user.username];
  var contestantInstance = {};
  var contestInfo = {};

  var parseAthlete = function(athlete, callback) {
    callback(null, JSON.parse(athlete));
  };

  if (typeof(contestant) === 'undefined') {
    res.send(404, 'Contestant not found.');
  }
  else {
    contestantInstance = 
      JSON.parse(contestant).instances[contestantInstanceIndex];

    if (typeof(contestantInstance) === 'undefined') {
      res.send(404, 'Contestant Instance not found.');
    }
    else if (
      (currentTime - contestantInstance.lastModified) / 60000 < 
      contest.cooldown_minutes) {
      res.send(
        400, 
        Math.ceil(
          contest.cooldown_minutes - 
          (currentTime - contestantInstance.lastModified) / 60000) + 
          ' minutes of cooldown time left.');
    }
    else {
      async.map(contest.athletes, parseAthlete, function(err, result) {
        if (err) {
          res.send(500, 'Server error.');
        }
        else {
          contestInfo = { 
            contestId: contest.contest_id,
            contestantInstanceIndex: contestantInstanceIndex,
            contestantInstance: contestantInstance,
            athletes: result,
            maxWager: contest.max_wager,
            startingVirtualMoney: contest.starting_virtual_money
          };

          res.render(
            'contestB/edit.hbs', 
            { 
              link: 'logout',
              display: 'Logout',
              contestInfo: contestInfo 
            });
        }
      });
    }
  }
}

var renderContestEditPage = function (req, res, next) {
  if (typeof(req.params.contestId) === 'undefined') {
    res.send(404, 'Not a valid contest ID.');
  }
  else if (typeof(req.params.contestantInstanceIndex) === 'undefined') {
    res.send(404, 'Not a valid instance index.');
  }
  else {
    async.waterfall([
      function (callback) {
        callback(null, req, res, next);
      },
      findContestByContestIdCheckEdit,
      filterContestFieldsEdit
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
 * CONTEST EDIT PROCESS
 * ====================================================================
 */
var findContestByContestIdEdit = function (req, res, next, callback) {
  ContestB.selectById(req.params.contestId, function (err, result) {
    if (err) {
      res.send(404, 'Contest not found.');
    }
    else {
      callback(null, req, res, next, result);
    }
  });
}

var submitEdit = function(req, res, next, contest, callback) {
  var user = req.user;
  var contestantInstanceIndex = req.params.contestantInstanceIndex;
  var contestant = contest.contestants[user.username];
  var contestantInstance = {};
  var instance = null;

  if (typeof(contestant) === 'undefined') {
    res.send(404, 'Contestant not found.');
  }
  else {
    contestantInstance = 
      JSON.parse(contestant).instances[contestantInstanceIndex];

    if (typeof(contestantInstance) === 'undefined') {
      res.send(404, 'Contestant Instance not found.');
    }
    else {
      instance = createInstance(req.body, contest);

      ContestB.updateContestantInstance(
        user, 
        contestantInstanceIndex,
        instance, 
        contest.contest_id,
        function (err) {
          if (err) {
            next(err);
          }
          else {
            res.redirect('/contestB');
          }
        });
    }
  }
}

var contestEditProcess = function (req, res, next) {
  if (typeof(req.params.contestId) === 'undefined') {
    res.send(404, 'Not a valid contest ID.');
  }
  else if (typeof(req.params.contestantInstanceIndex) === 'undefined') {
    res.send(404, 'Not a valid instance index.');
  }
  else {
    async.waterfall([
      function (callback) {
        callback(null, req, res, next);
      },
      findContestByContestIdEdit,
      submitEdit
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
 * CONTEST BACKGROUND FUNCTIONS (PYTHON SCRIPTS)
 * ====================================================================
 */

var runBackgroundScript = function (fileName) {
  return function (callback) {
    var python = childProcess.spawn('python', [fileName]);
    var output = '';

    python.stdout.on('data', function (data){
      output += data;
    });

    python.stderr.setEncoding('utf8');
    python.stderr.on('data', function (data) {
      console.log(data);
    });

    python.on('close', function(code) {
      console.log(output);
      callback(null);
    });
  };
}

var runParsePlayers = runBackgroundScript(scriptNames.parsePlayers);
var runParseAndUpdateGames = 
  runBackgroundScript(scriptNames.parseAndUpdateGames);

/*
 * ====================================================================
 * CONTEST BACKGROUND FUNCTIONS (OPEN AND FILLED CONTESTS)
 * ====================================================================
 */

var getContestsOpenAndFilled = function (callback) {
  ContestB.selectOpenToFilled('Baseball', function (err, contests) {
    callback(err, contests);
  });
}

var updateStateContestsOpenAndFilledHelper = function (currentTime) {
  return function (contest, callback) {
    var finalCallback = function (err) {
      callback(err);
    }

    if (contest.contest_deadline_time.getTime() + 900000 <= 
        currentTime.getTime()) {
      if (contest.current_entries >= contest.minimum_entries) {
        ContestB.setToProcess(contest.contest_id, finalCallback);
      }
      else {
        ContestB.setCancelled(contest.contest_id, function (err) {
          if (err) {
            callback(err);
          }
          else {
            cancel.refundCancelledContestUsers(contest, finalCallback);
          }
        });
      }
    }
    else {
      callback(null);
    }
  };
}

var updateStateContestsOpenAndFilled = function (contests, callback) {
  var currentTime = new Date();

  async.map(contests, updateStateContestsOpenAndFilledHelper(currentTime),
    function (err) {
      callback(err);
    });
}

var examineContestsOpenAndFilled = function (callback) {
  async.waterfall([
    getContestsOpenAndFilled,
    updateStateContestsOpenAndFilled,
    ],
    function (err) {
      callback(err);
    });
}

/*
 * ====================================================================
 * CONTEST BACKGROUND FUNCTIONS (TO PROCESS CONTESTS)
 * ====================================================================
 */

var checkContestEnd = function (contest, callback) {
  async.reduce(contest.games, true,
    function (memo, game, callback) {
      Game.select(JSON.parse(game).gameId, function (err, game) {
        if (err) {
          callback(err, false);
        }
        else {
          callback(null, game.status === 'closed' ? memo : false);
        }
      });
    },
    function (err, result) {
      callback(err ? false : result);
    });
}

var getContestsToProcess = function (callback) {
  ContestB.selectContestsToProcess('Baseball', function (err, contests) {
    if (err) {
      callback(err);
    }
    else {
      async.filter(contests, checkContestEnd,
        function (contests) {
          callback(null, contests);
        });
    }
  });
}

var updateStateContestsToProcess = function (contests, callback) {
  async.map(contests, calculate.calculateWinningsForContest,
    function (err) {
      callback(err);
    });
}

var examineContestsToProcess = function (callback) {
  async.waterfall([
    getContestsToProcess,
    updateStateContestsToProcess,
    ],
    function (err) {
      callback(err);
    });
}

/*
 * ====================================================================
 * CONTEST BACKGROUND FUNCTION INITIALIZATION
 * ====================================================================
 */

function setRepeat (func, interval) {
  var callback = function (err) {
    if (err) {
      console.log(err);
    }
    setRepeat(func, interval);
  };

  setTimeout(function () {
    func(callback);
  }, interval);
}

/*setRepeat(runParsePlayers, 86400000);
setRepeat(runParseAndUpdateGames, 7200000);
setRepeat(examineContestsOpenAndFilled, 60000);
setRepeat(examineContestsToProcess, 60000);*/

function runAndSetRepeat (func, interval) {
  var callback = function (err) {
    if (err) {
      console.log(err);
    }

    setTimeout(function () {
      runAndSetRepeat(func, interval)
    }, interval);
  };

  func(callback);
}

//times in milliseconds
runAndSetRepeat(runParsePlayers, 86400000);
runAndSetRepeat(runParseAndUpdateGames, 7200000);
runAndSetRepeat(examineContestsOpenAndFilled, 60000);
runAndSetRepeat(examineContestsToProcess, 60000);

/*
 * ====================================================================
 * EXPORTS
 * ====================================================================
 */

exports.renderContestPage = renderContestPage;
exports.sendContestTable = sendContestTable;
exports.renderContestInfoPage = renderContestInfoPage;
exports.renderContestCreationPage = renderContestCreationPage;
exports.contestCreationProcess = contestCreationProcess;
exports.renderContestEntryPage = renderContestEntryPage;
exports.contestEntryProcess = contestEntryProcess;
exports.renderContestEditPage = renderContestEditPage;
exports.contestEditProcess = contestEditProcess;