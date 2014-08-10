var sportsdataNfl = require('sportsdata').NFL;
var sportsdataMlb = require('sportsdata').MLB;

sportsdataNfl.init('t', 1, 'rmbgzsxq9n4j2yyqx4g6vafy', 2013, 'REG');
sportsdataMlb.init('t', 4, 'grnayxvqv4zxsamxhsc59agu', 2014, 'REG');
var BaseballPlayerStatistics = require('libs/cassandra/baseball/player.js')

/* calculates the fantasy points for a specific player*/
exports.calculateMlbFantasyPoints = function(athlete, callback) {
  var athleteId = playerObject.athleteId; //player is id not name
  var isOnHomeTeam = playerObject.isOnHomeTeam;
  var gameId = playerObject.prefixSchedule.$.id;
  var shortHomeTeam = playerObject.prefixSchedule.home[0].$.abbr;
  var longHomeTeam = playerObject.prefixSchedule.home[0].$.name;
  var shortVisitorTeam = playerObject.prefixSchedule.visitor[0].$.abbr;
  var longVisitorTeam = playerObject.prefixSchedule.visitor[0].$.name;
  

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

        var gameId = stats.statistics.$.id //check if right
        var date = new Date();
        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        month = (month < 10 ? '0' : '') + month;
        var day = date.getDate();
        day = (day < 10 ? '0' : '') + day;
        var gameDate = '' + year + '/' + month + '/' + day;

        var length = prefixPitching.length;
        var bool = false;

        /* player statistics */
        var strikeoutsPitched = null;
        var era = null;
        var hitsAllowed = null;
        var bbAllowed = null;
        var hbpAllowed = null;
        var inningsPitched = null;
        var singles = null;
        var doubles = null;
        var triples = null;
        var homeruns = null;
        var rbi = null;
        var bb = null;
        var hbp = null;
        var runs = null;
        var caught = null;
        var stolen = null;
        var strikeouts = null;

        for (var j = 0; j < length; j++) {
          if (athleteId === prefixPitching[j].$.id) {
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

            strikeouts = prefixPitching[j].outs[0].$.ktotal;
            era = prefixPitching[j].runs[0].$.earned;
            hitsAllowed = prefixPitching[j].onbase[0].$.h;
            bbAllowed = prefixPitching[j].onbase[0].$.bb;
            hbpAllowed = prefixPitching[j].onbase[0].$.hbp;
            inningsPitched = prefixPitching[j].$.ip_1;

            count += 0.5* strikeouts - era - hitsAllowed - bbAllowed
            - hbpAllowed + inningsPitched;

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
          if (athleteId === prefixHitting[i].$.id && bool === false) {
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

            singles = parseInt(prefixHitting[i].onbase[0].$.s);
            doubles = parseInt(prefixHitting[i].onbase[0].$.d);
            triples = parseInt(prefixHitting[i].onbase[0].$.t);
            homeruns = parseInt(prefixHitting[i].onbase[0].$.hr);
            rbi = parseInt(prefixHitting[i].$.rbi);
            bb = parseInt(prefixHitting[i].onbase[0].$.bb);
            hbp = parseInt(prefixHitting[i].onbase[0].$.hbp);
            runs = parseInt(prefixHitting[i].runs[0].$.total);
            caught = parseInt(prefixHitting[i].steal[0].$.caught);
            strikeouts = parseInt(prefixHitting[i].outs[0].$.ktotal);
            stolen = parseInt(prefixHitting[i].steal[0].$.stolen);


            count = singles + 2*doubles + 3*triples + 4*homeruns + rbi + bb
            + hbp + runs - caught - strikeouts/2.0 + 2* stolen;
          }
        }

        /* insert player statistics into database */
        /* need to check for double inserting */
        var inGamePosition;
        if (bool === true) {
          inGamePosition = 'pitching';
        }
        else {
          inGamePosition = 'hitting'
        }

        BaseballPlayerStatistics.addPlayerStatistics(
          athleteId, //athlete_id
            'MLB', //sport
            inGamePosition, //in_game_position
            shortHomeTeam,//shortHomeTeam
            longHomeTeam,//longHomeTeam
            gameId, //game_id
            year, //season year
            shortVisitorTeam,//short Visitor Team
            longVisitorTeam,//long Visitor Team
            isOnHomeTeam, //is on home team?
            gameDate, //game_date
            singles, //single - pitcher hits don't count
            doubles, //double
            triples, //triples
            homeruns, //homeruns
            runs, //runs
            rbi, //rbis
            stolen, //stolen bases
            caught, //caught stealing
            bb, //walks
            era, //era
            strikeouts, //strikeout !
            hbp, //hit by pitched !
            strikeoutsPitched, // strikeouts
            bbAllowed, //walks allowed
            hbpAllowed, //hits allowed
            count, //fantasy points
            callback
          )
        callback(null, count);
      }
    }
    else {
      callback(err);
    }
  });
}