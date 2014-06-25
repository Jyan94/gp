var sportsdataNfl = require('sportsdata').NFL;
var sportsdataMlb = require('sportsdata').MLB;

sportsdataNfl.init('t', 1, 'rmbgzsxq9n4j2yyqx4g6vafy', 2013, 'REG');
sportsdataMlb.init('t', 4, 'f8rhpkpxsxdvhzrr3vmxn8wk', 2014, 'REG');

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
exports.calculateNflFantasyPoints = function(playerObject, callback) {
  var playerName = playerObject.player;
  var teamName = playerObject.prefixSchedule.$.home;
  var opponentName = playerObject.prefixSchedule.$.away;
  var boolHome = playerObject.isOnHomeTeam;
  var year = playerObject.year;
  var week = playerObject.week;

  var awayTeam = null;
  var homeTeam = null;

  if (boolHome === true) {
    awayTeam = opponentName;
    homeTeam = teamName;
  } else {
    awayTeam = teamName;
    homeTeam = opponentName;
  }

  console.log('Mini Breakpoint:', awayTeam, homeTeam);

  sportsdataNfl.getGameStats(week, awayTeam, homeTeam,
    function(err, stats) {
      if (!err) {
        var arrayIndex = null;

        if (boolHome === true) {
          arrayIndex = 0;
        } else {   
          arrayIndex = 1;
        }

        var points = 0.0;
        var prefixPass = stats.game.team[arrayIndex].passing[0].player;

        for (var i = 0; i < prefixPass.length; i++) {
          if (prefixPass[i].$.name === playerName) {
            points = 
              points + 
              prefixPass[i].$.yds/25.0 + 
              4*prefixPass[i].$.td - 
              2*prefixPass[i].$.int;
          }
        }

        var prefixRush = stats.game.team[arrayIndex].rushing[0].player;

        for (var j = 0; j < prefixRush.length; j++) {
          if (prefixRush[j].$.name === playerName) {
            points = 
              points + 
              prefixRush[j].$.yds/10 + 
              6*prefixRush[j].$.td;
          }
        }

        var prefixRec = stats.game.team[arrayIndex].receiving[0].player;

        for (var k = 0; k < prefixRec.length; k++) {
          if (prefixRec[k].$.name === playerName) {
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
            if (prefixTwoPointConv[l].$.name === playerName) {
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
            if (prefixFumbles[m].$.name === playerName) {
              points = 
                points - 
                2*(prefixFumbles[m].$.lost);
            }
          }
        }

        callback(null, points);
      } else {
        callback(err);
      }
    });
}