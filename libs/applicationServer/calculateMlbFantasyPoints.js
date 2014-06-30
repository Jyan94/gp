var sportsdataNfl = require('sportsdata').NFL;
var sportsdataMlb = require('sportsdata').MLB;

sportsdataNfl.init('t', 1, 'rmbgzsxq9n4j2yyqx4g6vafy', 2013, 'REG');
sportsdataMlb.init('t', 4, 'grnayxvqv4zxsamxhsc59agu', 2014, 'REG');

/* calculates the fantasy points for a specific player*/
exports.calculateMlbFantasyPoints = function(playerObject, callback) {
  var playerId = playerObject.playerId; //player is id not name
  var isOnHomeTeam = playerObject.isOnHomeTeam;
  var gameId = playerObject.prefixSchedule.$.id;
  var count = 0.0;

  sportsdataMlb.getGameStatistics(gameId, function(err, stats){
    if (!err) {
      if (stats === undefined || !stats.hasOwnProperty('statistics')) {
        setTimeout(function() {
          exports.calculateMlbFantasyPoints(playerObject, callback);
        }, 1001);
      }
      else {
        var prefixHitting;
        var prefixPitching;
        if (isOnHomeTeam === true) {
          prefixHitting = stats.statistics.home[0].hitting[0].players[0].player;
          prefixPitching = stats.statistics.home[0].pitching[0].players[0].player;
        }
        else {
          prefixHitting = stats.statistics.visitor[0].hitting[0].players[0].player;
          prefixPitching = stats.statistics.visitor[0].pitching[0].players[0].player;
        }

        var length = prefixPitching.length;
        var bool = false;

        for (var j = 0; j < length; j++) {
          if (playerId === prefixPitching[j].$.id) {
            bool = true;

            if (prefixPitching[j].games[0].$.win === 1) {
              count = count + 7;
            }
            if (prefixPitching[j].games[0].$.loss ===1) {
              count = count - 5;
            }
/*
            console.log("ktotalP: " + prefixPitching[j].outs[0].$.ktotal);
            console.log("eraP: " + prefixPitching[j].runs[0].$.earned);
            console.log("hitsP: " + prefixPitching[j].onbase[0].$.h);
            console.log("bbP: " + prefixPitching[j].onbase[0].$.bb);
            console.log("hbpP: " + prefixPitching[j].onbase[0].$.hbp);
            console.log("ip_1P: " + prefixPitching[j].$.ip_1);
*/
            count += 0.5 *prefixPitching[j].outs[0].$.ktotal;
            count -= prefixPitching[j].runs[0].$.earned;
            count -= prefixPitching[j].onbase[0].$.h;
            count -= prefixPitching[j].onbase[0].$.bb;
            count -= prefixPitching[j].onbase[0].$.hbp;
            count += prefixPitching[j].$.ip_1;

            if (prefixPitching[j].runs[0].$.earned <= 3 && prefixPitching[j].$.ip_1 > 21) {
              count = count + 3;
            }
            if (prefixPitching[j].games[0].$.save === 1) {
              count = count + 5;
            }
          }
        }

        length = prefixHitting.length;
        for (var i = 0; i < length; i++) {
          if (playerId === prefixHitting[i].$.id && bool === false) {
            /*
            console.log("s: " + parseInt(prefixHitting[i].onbase[0].$.s));
            console.log("d: " + parseInt(2*prefixHitting[i].onbase[0].$.d));
            console.log("t: " + parseInt(3*prefixHitting[i].onbase[0].$.t));
            console.log("hr: " + parseInt(4*prefixHitting[i].onbase[0].$.hr));
            console.log("rbi: " + parseInt(prefixHitting[i].$.rbi));
            console.log("bb: " + parseInt(prefixHitting[i].onbase[0].$.bb));
            console.log("hbp: " + parseInt(prefixHitting[i].onbase[0].$.hbp));
            console.log("runs: " + parseInt(prefixHitting[i].runs[0].$.total));
            console.log("caught: " + parseInt(prefixHitting[i].steal[0].$.caught));
            console.log("strikeouts: " + parseInt(prefixHitting[i].outs[0].$.ktotal/2.0));
            console.log("stolen: " + parseInt(2*prefixHitting[i].steal[0].$.stolen));
*/
            count = parseInt(prefixHitting[i].onbase[0].$.s);
            count += parseInt(2*prefixHitting[i].onbase[0].$.d);
            count += parseInt(3*prefixHitting[i].onbase[0].$.t);
            count += parseInt(4*prefixHitting[i].onbase[0].$.hr);
            count += parseInt(prefixHitting[i].$.rbi);
            count += parseInt(prefixHitting[i].onbase[0].$.bb);
            count += parseInt(prefixHitting[i].onbase[0].$.hbp);
            count += parseInt(prefixHitting[i].runs[0].$.total);
            count -= parseInt(prefixHitting[i].steal[0].$.caught);
            count -= parseInt(prefixHitting[i].outs[0].$.ktotal/2.0);
            count += parseInt(2*prefixHitting[i].steal[0].$.stolen);
          }
        }
        callback(null, count);
      }
    }
    else {
      callback(err);
    }
  });
}