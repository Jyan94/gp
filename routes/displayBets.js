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




sportsdata_nfl.init('t', 1, 'gzjpc3dseum9ps25td2y6mtx', 2014, 'REG');
sportsdata_mlb.init('t', 4, 'f8rhpkpxsxdvhzrr3vmxn8wk', 2014, 'REG');
/*
sportsdata_mlb.getGameBoxscore('370e8f9d-1e9d-425c-97de-2610988fd5b5', function(err, schedule) {
  if (!err) {
    console.log(schedule);
  }
})*/

/*
sportsdata_mlb.get3DaySchedule(function(err, result) {
  if (!err) {
    var test = result.outlook.schedules[0].event[12].$.id;

    sportsdata_mlb.getPlayByPlay(test, function(err, schedule) {
      if (!err) {
        console.log(schedule);
      }
    })
  }
})*/

/*
sportsdata_nfl.getWeeklySchedule(1, function(error, schedule) {
 if (!error) {
    console.log(schedule.games.game[0]);
  }
});


//don't make function inside a loop Need to change!!

var checkEndGames = function(game_id, status, year, week) {
  var rows;
  sportsdata_nfl.init('t', 1, 'gzjpc3dseum9ps25td2y6mtx', year, 'REG');
  sportsdata_nfl.getWeeklySchedule(1, function(err, schedule){
    if (!err) {
      var prefixSchedule = schedule.games.game;
      for (var i = 0; i < prefixSchedule.length; i++) {

        if (prefixSchedule[i].$.status === 'closed' && flag === false) {
          var query = 'SELECT player_id, player FROM team WHERE team = ?'
          var params = [prefixSchedule[i].$.home];
          client.executeAsPrepared(query, params, cql.types.consistencies.one, function(err, result) {
            rows = result.rows[0];
            for (var i = 0; i < rows.length; i++) {
              calculateFantasyPoints(rows.player, prefixSchedule[i].home, prefixSchedule[i].away, true, year, week, function(err, result) {
                var fantasyPoints = result;
                var query = 'SELECT bet_id FROM current_bets WHERE player_id = ?'
                var params = [rows.player_id];
                client.executeAsPrepared(query, params, cql.types.consistencies.one, function(err, result) {
                  rows = result.rows[0];
                  for (var i = 0; i < rows.length; i++) {
                    var query = 'SELECT bet_value, multiplier, long_better_id, short_better_id FROM current_bets WHERE bet_id = ?'
                    var params = [rows.bet_id];
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
                        // delete from current_bets and maybe insert it into all_bets
                      })
                    })
                  }
                })
              })
            }
          })
        }
      }
    }
  })
}
*/
/*sportsdata_nfl.getGameStats(1, 'NYG', 'DAL', function(err, stats) {
  if (!err) {
    var prefixPass = stats.game.team[]
    console.log(stats.game.team[0].two_point_conversion[0].player)
  }
})*/

/*need to add REG or PLAYOFFS*/

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
          points = points + prefixRush[j].$.yds/10 + 6*prefixRush[j].$.td - 2*prefixRush[j].$.fum;
        }
      }
      var prefixRec = stats.game.team[arrayIndex].receiving[0].player;
      for (var k = 0; k < prefixRec.length; k++) {
        if (prefixRec[k].$.name === player_name) {
           points = points + prefixRec[k].$.yds/10 + 6*prefixRec[k].$.td;
        }
      }
      var prefixTwoPointConv = stats.game.team[0].two_point_conversion[0].player;
      for (var l = 0; l < prefixTwoPointConv.length; l++) {
        if (prefixTwoPointConv[l].$.name === player_name) {
          points = points + 2*(prefixTwoPointConv[l].$.pass + prefixTwoPointConv[l].$.rush + prefixTwoPointConv[l].$.rec);
        }
      }
      callback(null, points);
    }
    else {
      callback(err);
    }
  })
}

calculateFantasyPoints('Tony Romo', 'DAL', 'NYG', true, '2013', 1, function(err, result) {
  if (err) {
    console.log(err);
    return;
  }
  console.log(result);
});


/* Routing */
app.get('/', function (req, res) {
  var rows;
  var betinfo = [];
  var query = 'SELECT bet_id, username, long_position, bet_value, multiplier FROM pending_bets';
  client.executeAsPrepared(query,
    cql.types.consistencies.one,
    function(err, result){
      rows = result.rows;
      for (var i = 0; i < rows.length; i++) {
        betinfo[i] = {
          bet_id: rows[i].bet_id,
          username: rows[i].username,
          long_position: rows[i].long_position,
          bet_value: rows[i].bet_value,
          multiplier: rows[i].multiplier
        }
      }
      res.render('market', {betinfo : betinfo});
    });
});

app.post('/submitForm', function (req, res) {
  var betId = cql.types.timeuuid();
  if (req.body.longOrShort === 'Above') {
    var queries = [
    {
      query: 'INSERT INTO pending_bets (bet_id, user_id, username, long_position, bet_value, multiplier) VALUES (?, ?, ?, ?, ?, ?)',
      params: [betId, req.user.user_id, req.user.username, true, parseInt(req.body.price), parseInt(req.body.shareNumber)]
    },
    {
      query: 'INSERT INTO user_id_to_bet_id (user_id, bet_id) VALUES (?, ?)',
      params: [req.user.user_id, betId]
    }
    ];
    client.executeBatch(queries, cql.types.consistencies.one, function(err) {
      if (err) {
        console.log(err);
      }
      else {
        res.redirect('/');
      }
    });
  }
  else if (req.body.longOrShort === 'Under') {
    var queries1 = [
    {
      query: 'INSERT INTO pending_bets (bet_id, user_id, username, long_position, bet_value, multiplier) VALUES (?, ?, ?, ?, ?, ?)',
      params: [betId, req.user.user_id, req.user.username, false, parseInt(req.body.price), parseInt(req.body.shareNumber)]
    },
    {
      query: 'INSERT INTO user_id_to_bet_id (user_id, bet_id) VALUES (?, ?)',
      params: [req.user.user_id, betId]
    }
    ]
    client.executeBatch(queries1, cql.types.consistencies.one, function(err) {
      if (err) {
        console.log(err);
      }
      else{
        res.redirect('/');
      }
    });
  }
});


app.post('/addBets', function (req, res) {

  var bet_id = req.body.bet_id;
  var query0 = 'SELECT username, bet_value, multiplier FROM pending_bets WHERE bet_id = ?'
  var params0 = [bet_id];
  client.executeAsPrepared(query0, params0, cql.types.consistencies.one, function(err, result) {
    if (err) {
      console.log(err);
    }
    else {
      var long_better = result.rows[0].username;
      console.log(long_better);
      var bet_value = result.rows[0].bet_value;
      console.log(bet_value);
      var multiplier = result.rows[0].multiplier
      console.log(multiplier);
      var queries = [
        {
          query: 'DELETE FROM pending_bets WHERE bet_id = ?',
          params: [bet_id]
        },
        {
          query: 'INSERT INTO current_bets (bet_id, long_better_id, short_better_id, bet_value, multiplier) VALUES (?, ?, ?, ?, ?)',
          params: [bet_id, long_better, req.user.username, bet_value, multiplier]
        },
        {
          query: 'INSERT INTO user_id_to_bet_id (user_id, bet_id) VALUES (?, ?)',
          params: [req.user.user_id, bet_id]
        }
      ];
      client.executeBatch(queries, cql.types.consistencies.one, function(err) {
        if (err) {
          console.log(err);
        }
      })
    }
  })
})
app.listen(3000);