require('rootpath')();
var express = require('express');
var app = module.exports = express();
var configs = require('config/index');
configs.configure(app);

var cql = configs.cassandra.cql;
var client = configs.cassandra.client;

app.use('/', require('../app.js'));

var sportsdata_nfl = require('sportsdata').NFL;
var sportsdata_mlb = require('sportsdata').MLB;
var async = require('async');

sportsdata_nfl.init('t', 1, 'gzjpc3dseum9ps25td2y6mtx', 2013, 'REG');
sportsdata_mlb.init('t', 4, 'f8rhpkpxsxdvhzrr3vmxn8wk', 2014, 'REG');

/**
 * takes as parameter the following object:
 * {
          'player': players[i].name,
          'prefixSchedule': prefixSchedule,
          'isOnHomeTeam': players[i].isOnHomeTeam,
          'year': year,
          'week': week
    }
 */
var calculateFantasyPoints = function(playerObject, callback) {
  var player_name = playerObject.playerName;
  var team_name = playerObject.prefixSchedule.$.home;
  var opponent_name = playerObject.prefixSchedule.$.away;
  var boolHome = playerObject.isOnHomeTeam;
  var year = playerObject.year;
  var week = playerObject.week;

  var away_team;
  var home_team;
  if (boolHome === true) {
    away_team = opponent_name;
    home_team = team_name;
  }
  else {
    away_team = team_name;
    home_team = opponent_name;
  }

  sportsdata_nfl.getGameStats(week, away_team, home_team, function(err, stats) {
    if (!err) {
      var arrayIndex;
      if (boolHome === true) {
        arrayIndex = 0;
      }
      else {
        arrayIndex = 1;
      }
      var points = 0.0;
      var prefixPass = stats.game.team[arrayIndex].passing[0].player;
      for (var i = 0; i < prefixPass.length; i++) {
        if (prefixPass[i].$.name === player_name) {
          points = 
            points + 
            prefixPass[i].$.yds/25.0 + 
            4*prefixPass[i].$.td - 
            2*prefixPass[i].$.int;
        }
      }
      var prefixRush = stats.game.team[arrayIndex].rushing[0].player;
      for (var j = 0; j < prefixRush.length; j++) {
        if (prefixRush[j].$.name === player_name) {
          points = 
            points + 
            prefixRush[j].$.yds/10 + 
            6*prefixRush[j].$.td;
        }
      }
      var prefixRec = stats.game.team[arrayIndex].receiving[0].player;
      for (var k = 0; k < prefixRec.length; k++) {
        if (prefixRec[k].$.name === player_name) {
           points = 
            points + 
            prefixRec[k].$.yds/10 + 
            6*prefixRec[k].$.td;
        }
      }
      if (stats.game.team[arrayIndex].two_point_conversion !== undefined) {
        var prefixTwoPointConv = 
          stats.game.team[arrayIndex].two_point_conversion[0].player;
        for (var l = 0; l < prefixTwoPointConv.length; l++) {
          if (prefixTwoPointConv[l].$.name === player_name) {
            console.log(points);
            points = 
              points + 
              2*
                (prefixTwoPointConv[l].$.pass + 
                  prefixTwoPointConv[l].$.rush + 
                  prefixTwoPointConv[l].$.rec);
          }
        }
      }
      if (stats.game.team[arrayIndex].fumbles.player !== undefined) {
        console.log(stats.game.team[arrayIndex].fumbles)
        var prefixFumbles = stats.game.team[arrayIndex].fumbles[0].player;
        for (var m = 0; m < prefixFumbles.length; m++) {
          if (prefixFumbles[m].$.name === player_name) {
            points = 
              points - 
              2*(prefixFumbles[m].$.lost)
          }
        }
      }
      callback(null, points);
    }
    else {
      callback(err);
    }
  })
}

/**
 * takes a betId and a fantasy point value and updates a user's wallet
 * @param  {uuid}   betId
 * @param  {double}   fantasyPoints [single fantasy point value]
 * @param  {Function} callback
 */
function calculateBet(betId, fantasyPoints, callback) {
  var rows;
  var query = 'SELECT bet_value, multiplier, long_better_id, short_better_id FROM current_bets WHERE bet_id = ?'
  var params = [betId];
  client.executeAsPrepared(
    query, 
    params, 
    cql.types.consistencies.one, 
    function(err, result) {
    rows = result.rows[0]
    var longWinnings = rows.multiplier * (fantasyPoints - rows.bet_value);
    var shortWinnings = rows.multiplier * (rows.bet_value - fantasyPoints);
    console.log(longWinnings);
    console.log(shortWinnings);
    var queries = [
    {
      query: 'UPDATE users SET cash = cash +  WHERE user_id = ?',
      params: [rows.long_better_id]
    },
    {
      query: 'UPDATE users SET cash = cash +  WHERE user_id = ?',
      params: [rows.short_better_id]
    }
    ]
    client.executeBatch(
      queries, 
      cql.types.consistencies.one, 
      function(err) {
        if (err) {
          console.log(err);
        } else {
          callback(null);
        }
    });
  });
}

/**
 * [processArrayBets description]
 * @param  {[type]}   betArray
 * @param  {[type]}   fantasyPoints
 * @param  {Function} callback
 * @return {[type]}
 */
//betArray is an array of arrays
//the index of each entry in fantasyPoints corresponds to an array of bets
//in betsArray
function processArrayBets(betsArray, fantasyPoints) {
  var errCallback = function(err) {
    if (err) {
      console.log(err);
    }
  };
  for (var i = 0; i !== betsArray.length; ++i) {
    var betIds = betsArray[i];
    for (var j = 0; j !== betIds.length; ++j) {
      calculateBet(betIds[j], fantasyPoints[i], errCallback);
    }
  }
}


function getBetIdsFromPlayerId(playerId, callback) {
  var query = 'SELECT bet_id FROM current_bets WHERE player_id = ?';
  var params = [playerId];
  client.executeAsPrepared(
    query,
    params,
    cql.types.consistencies.one,
    function(err, result) {
      if (err) {
        console.log(err);
      } else {
        //returns a list of bets
        callback(null, result.rows);
      }
    });
}

//result returned:
/**
 * [
 *  { 'name': player1name, 'id': player1id, 'isOnHomeTeam': [bool] }
 *  { 'name': player2name, 'id': player2id, 'isOnHomeTeam': [bool] }
 *  ...
 * ]
 */
function findClosedSchedulesAndPlayers(prefixSchedElement, callback) {
  var rows;
  var retArray = [];
  var hometeam = prefixSchedElement.$.home;
  var awayteam = prefixSchedElement.$.away;
  if (prefixSchedElement.$.status === 'closed') {
    async.waterfall([

      //pushes on the home players
      function (callback) {
        var query = 'SELECT player_id, player FROM team WHERE team = ?'
        var params = [hometeam];
        client.executeAsPrepared(
          query,
          params,
          cql.types.consistencies.one,
          function (err, result) {
            if (err) {
              console.log(err);
            } else {
              for (var i = 0; i < result.rows.length; i++) {
                retArray.push({
                  'name': result.rows[i].player,
                  'id': result.rows[i].player_id,
                  'isOnHomeTeam': true
                });
              }
              callback(null, retArray);
            }
          });
      },

      //pushes on the away players
      function (arr, callback) {
        var query = 'SELECT player_id, player FROM team WHERE team = ?'
        var params = [awayteam];
        client.executeAsPrepared(
          query, 
          params, 
          cql.types.consistencies.one, 
          function(err, result) {
            if (err) {
              console.log(err);
            } else {
              for (var i = 0; i < result.rows.length; i++) {
                arr.push({
                  'name': result.rows[i].player,
                  'id': result.rows[i].player_id,
                  'isOnHomeTeam': false
                });
              }
              callback(null, arr);
            }
          });
      }
      ], function (err, result) {
        callback(null, retArray);
      });
  }
}

//first waterfall function
//gets list of players + player_id
function getPlayers(prefixSchedule, year, week, callback) {
  async.map(
    prefixSchedule,
    findClosedSchedulesAndPlayers,
    //result here is an array of objects specified by return value of
    //findClosedSchedulesAndPlayer function
    function(err, result) {
      if (err) {
        console.log(err);
      } else {
        callback(null, result);
      }
    });
}

function getBetIds(players, prefixSchedule, year, week, callback) {
  var mapArray = [];
  var playerIds = [];
  for (var i = 0; i !== players.length; ) {
    mapArray.push({
      'player': players[i].name,
      'prefixSchedule': prefixSchedule,
      'isOnHomeTeam': players[i].isOnHomeTeam,
      'year': year,
      'week': week
    });
    playerIds.push(players[i].id);
  }
  //returns an array of fantasy points as result
  //matches playerIds array
  async.map(mapArray, calculateFantasyPoints, function (err, result) {
    if (err) {
      console.log(err);
    } else {
      callback(null, playerIds, result);
    }
  });
}

function getBetIdsPlayerId(playerIds, fantasyPointsArray, callback) {
  async.map(playerIds, getBetIdsFromPlayerId, function (err, result) {
    //result is an array of bet arrays
    if (err) {
      console.log(err);
    } else {
      callback(null, result, fantasyPointsArray);
    }
  });
}

function processBets(betslist, fantasyPointsArray, callback) {
  processArrayBets(betslist, fantasyPointsArray);
}

function calculateAllFantasyPoints(schedule, year, week) {
  var prefixSchedule = schedule.games.game;
  async.waterfall([
    //starts off chain
    function (callback) {
      callback(null, prefixSchedule, year, week);
    },
    //first waterfall function
    //gets list of players + player_id
    getPlayers,
    //second waterfall function
    //get all bet ids associated with player
    //result.rows is list of players and player_id queried from database
    getBetIds,
    //third waterfall function
    //get all bet ids corresponding to given player id
    getBetIdsPlayerId,
    //fourth waterfall function
    processBets
    ], 
    function (err) {
      if (err) {
        console.log(err);
      }
    });
}

var checkEndGames = function(year, week) {
  var rows;
  sportsdata_nfl.getWeeklySchedule(1, function(err, schedule) {
    if (err) {
      console.log(err);
    } else {
      calculateAllFantasyPoints(schedule, year, week);
    }
  });
};

checkEndGames(2013, 6);
//async.map schedules -> closed schedules
//async.map closed schedules -> player objects
//async.each player objects -> get bets and update
app.listen(3000);

//tests
//for calculating fantasy points
/*calculateFantasyPoints('Andre Johnson', 'HOU', 'SD', false, '2013', 1, function(err, result) {
  if (err) {
    console.log(err);
    return;
  }
  console.log(result);
});*/
