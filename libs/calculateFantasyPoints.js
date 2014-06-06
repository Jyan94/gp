var sportsdata_nfl = require('sportsdata').NFL;
var sportsdata_mlb = require('sportsdata').MLB;

sportsdata_nfl.init('t', 1, 'rmbgzsxq9n4j2yyqx4g6vafy', 2013, 'REG');
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
exports.calculateFantasyPoints = function(playerObject, callback) {
  var player_name = playerObject.player;
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

  console.log('Mini Breakpoint:', away_team, home_team);

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