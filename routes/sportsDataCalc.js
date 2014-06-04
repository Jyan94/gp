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

var request = require('request');
var xml2js = require('xml2js');
var parser = new xml2js.Parser();
var urlHelper = require('../libs/url_helper_mlb');
var urlHelper2 = require('../libs/url_helper_nfl')  //change name later

sportsdata_nfl.init('t', 1, 'gzjpc3dseum9ps25td2y6mtx', 2013, 'REG');
sportsdata_mlb.init('t', 4, 'f8rhpkpxsxdvhzrr3vmxn8wk', 2014, 'REG');

function createRequest(url, callback) {
  request(url, function(error, response, body) {
    if (!error && response.statusCode == 200) {

      parser.parseString(body, function(err, result) {
        callback(err, result);
      });
    }
    else {
      callback(error, body);
    }
  });
}

function getPlayerImages(callback) {
  var url = urlHelper2.getPlayerManifestsUrl();
  createRequest(url, callback);
}

function insertImages(i, callback) {
  getPlayerImages(function(err, result) {
    var urltemp = result.assetlist.asset[i].links[0].link[0].$.href
    var url = 'http://api.sportsdatallc.org/nfl-images-t2/usat' + urltemp + '?api_key=3khf4k9vsw7tmkzf7f56ej8u';
    var player = result.assetlist.asset[i].title[0];
    var query = 'INSERT INTO player_images (player_name, image_url) VALUES (?, ?)'
    var params = [player, url];
    client.executeAsPrepared(query, params, cql.types.consistencies.one, callback)
  })
}


function insertAll() {
  var length = 240;
  var arr = new Array(length);
  for (var i = 0; i < length; i++) {
    arr[i] = i;
  }
  var callback = function(err) {
    if (!err) {
      console.log('Success')
    }
  };
  async.eachSeries(
    arr,
    function(i, callback) {
      insertImages(i, callback)
    },
    callback
  );
}

insertAll();

/*
function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}


function insertAll() {
  var length = 2000;
  for (var i = 0; i < length; i++) {
    insertImages(i);
    sleep(1000);
  }
}

insertAll();
*/
/*need to add REG or PLAYOFFS*/
/*
var calculateFantasyPoints = function(player_name, team_name, opponent_name, boolHome, year, week, callback) {

  sportsdata_nfl.init('t', 1, 'gzjpc3dseum9ps25td2y6mtx', year, 'REG');
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
          points = points + prefixPass[i].$.yds/25.0 + 4*prefixPass[i].$.td - 2*prefixPass[i].$.int;
        }
      }
      var prefixRush = stats.game.team[arrayIndex].rushing[0].player;
      for (var j = 0; j < prefixRush.length; j++) {
        if (prefixRush[j].$.name === player_name) {
          points = points + prefixRush[j].$.yds/10 + 6*prefixRush[j].$.td;
        }
      }
      var prefixRec = stats.game.team[arrayIndex].receiving[0].player;
      for (var k = 0; k < prefixRec.length; k++) {
        if (prefixRec[k].$.name === player_name) {
           points = points + prefixRec[k].$.yds/10 + 6*prefixRec[k].$.td;
        }
      }
      if (stats.game.team[arrayIndex].two_point_conversion !== undefined) {
        var prefixTwoPointConv = stats.game.team[arrayIndex].two_point_conversion[0].player;
        for (var l = 0; l < prefixTwoPointConv.length; l++) {
          if (prefixTwoPointConv[l].$.name === player_name) {
            console.log(points);
            points = points + 2*(prefixTwoPointConv[l].$.pass + prefixTwoPointConv[l].$.rush + prefixTwoPointConv[l].$.rec);
          }
        }
      }
      if (stats.game.team[arrayIndex].fumbles.player !== undefined) {
        console.log(stats.game.team[arrayIndex].fumbles)
        var prefixFumbles = stats.game.team[arrayIndex].fumbles[0].player;
        for (var m = 0; m < prefixFumbles.length; m++) {
          if (prefixFumbles[m].$.name === player_name) {
            points = points - 2*(prefixFumbles[m].$.lost)
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

calculateFantasyPoints('Andre Johnson', 'HOU', 'SD', false, '2013', 1, function(err, result) {
  if (err) {
    console.log(err);
    return;
  }
  console.log(result);
});


function calculateBets(betId, fantasyPoints) {
  var rows;
  var query = 'SELECT bet_value, multiplier, long_better_id, short_better_id FROM current_bets WHERE bet_id = ?'
  var params = [betId];
  client.executeAsPrepared(query, params, cql.types.consistencies.one, function(err, result) {
    rows = result.rows[0]
    var longWinnings = rows.multiplier * (fantasyPoints - rows.bet_value);
    var shortWinnings = rows.multiplier * (rows.bet_value - fantasyPoints);
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
    client.executeBatch(queries, cql.types.consistencies.one, function(err) {
      if (err) {
        console.log(err);
      }
    })
  })
}

function getPlayerBetId(player_id, player) {



}

function findClosedSchedulesAndPlayers(team) {
  var rows;
  if (team.$.status === 'closed') {
    var query = 'SELECT player_id, player FROM team WHERE team = ?'
    var params = [team.$.home];
    client.executeAsPrepared(query, params, cql.types.consistencies.one, function(err, result) {
      rows = result.rows[0];
    })
  }
}

//don't make function inside a loop Need to change!!

var checkEndGames = function(game_id, status, year, week) {
  var rows;
  sportsdata_nfl.init('t', 1, 'gzjpc3dseum9ps25td2y6mtx', year, 'REG');
  sportsdata_nfl.getWeeklySchedule(1, function(err, schedule){
    if (!err) {
      var prefixSchedule = schedule.games.game;
      async.map(prefixSchedule, findClosedSchedulesAndPlayers(prefixSchedule), function(err))
        //need to query to see flag status

            for (var i = 0; i < rows.length; i++) {
              calculateFantasyPoints(rows.player, prefixSchedule[i].home, prefixSchedule[i].away, true, year, week, function(err, result) {
                var fantasyPoints = result;
                var query = 'SELECT bet_id FROM current_bets WHERE player_id = ?'
                var params = [rows.player_id];
                client.executeAsPrepared(query, params, cql.types.consistencies.one, function(err, result) {
                  rows = result.rows[0];
                  async.each(rows, calculateBets(rows, fantasyPoints), function(err) {
                    if (err) {
                      console.log(err);
                    }
                  });
                });
              });
            }
          }
        }
      }
    }
  })
}
*/
//async.map schedules -> closed schedules
//async.map closed schedules -> player objects
//async.each player objects -> get bets and update
app.listen(3000);