require('rootpath')();
var express = require('express');
var app = module.exports = express();
var configs = require('config/index');
configs.configure(app);

var cql = configs.cassandra.cql;
var client = configs.cassandra.client;

app.use('/', require('../app.js'));

var User = require('../libs/cassandra/user.js');
var Bet = require('../libs/cassandra/bet.js');
var Player = require('../libs/cassandra/player.js');
var calculate = require('../libs/calculateFantasyPoints.js');
var sportsdata_nfl = require('sportsdata').NFL;
var sportsdata_mlb = require('sportsdata').MLB;
var async = require('async');

sportsdata_nfl.init('t', 1, 'gzjpc3dseum9ps25td2y6mtx', 2013, 'REG');
sportsdata_mlb.init('t', 4, 'f8rhpkpxsxdvhzrr3vmxn8wk', 2014, 'REG');

//result returned:
/**
 * [
 *  { 'name': player1name, 'id': player1id, 'isOnHomeTeam': [bool] }
 *  { 'name': player2name, 'id': player2id, 'isOnHomeTeam': [bool] }
 *  ...
 * ]
 */
function findClosedSchedulesAndPlayers(prefixSchedElement, callback) {
  console.log(prefixSchedElement);
  var retArray = [];
  var hometeam = prefixSchedElement.$.home;
  var awayteam = prefixSchedElement.$.away;
  if (prefixSchedElement.$.status === 'closed') {
    async.waterfall([

      //pushes on the home players
      function (callback) {
        Player.selectUsingTeam(hometeam,
          function (err, result) {
            if (err) {
              console.log(err);
            }
            else {
              for (var i = 0; i < result.length; i++) {
                retArray.push({
                  'name': result[i].full_name,
                  'id': result[i].player_id,
                  'isOnHomeTeam': true,
                  'prefixSchedule': prefixSchedElement
                });
              }
              callback(null, retArray);
            }
          });
      },

      //pushes on the away players
      function (arr, callback) {
        Player.selectUsingTeam(awayteam,
          function(err, result) {
            if (err) {
              console.log(err);
            }
            else {
              for (var i = 0; i < result.length; i++) {
                arr.push({
                  'name': result[i].full_name,
                  'id': result[i].player_id,
                  'isOnHomeTeam': false,
                  'prefixSchedule': prefixSchedElement
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

function getBetsFromPlayerId(player_id, callback) {
  Bet.selectUsingPlayerID('current_bets', player_id, function (err, result) {
      if (err) {
        console.log(err);
      }
      else {
        //returns a list of bets
        callback(null, result);
      }
  });
}

/**
 * takes a betId and a fantasy point value and updates a user's wallet
 * @param  {uuid}   betId
 * @param  {double}   fantasyPoints [single fantasy point value]
 * @param  {Function} callback
 */
function calculateBet(bet, fantasyPoints, callback) {
  var rows = bet;
  var longWinnings = rows.multiplier * (fantasyPoints - rows.bet_value);
  var shortWinnings = rows.multiplier * (rows.bet_value - fantasyPoints);
  console.log(longWinnings);
  console.log(shortWinnings);
  User.updateCash([longWinnings, shortWinnings], [rows.long_better_id, rows.short_better_id],
    function(err) {
      if (err) {
        console.log(err);
      }
      else {
        callback(null);
      }
  });
}

//Waterfall functions start here

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
      }
      else {
        callback(null, result, year, week);
      }
    });
}

function getBetIds(players, year, week, callback) {
  console.log(players);
  var mapArray = [];
  var playerIds = [];
  var currentGame = null;
  var currentPlayer = null;

  for (var i = 0; i !== players.length; i++) {
    currentGame = players[i];

    for (var j = 0; j !== players[i].length; i++) {
      currentPlayer = currentGame[j];

      mapArray.push({
        'player': currentPlayer.name,
        'prefixSchedule': currentPlayer.prefixSchedule,
        'isOnHomeTeam': currentPlayer.isOnHomeTeam,
        'year': year,
        'week': week
      });
      playerIds.push(currentPlayer.id);
    }
  }
  //returns an array of fantasy points as result
  //matches playerIds array
  console.log(mapArray);
  async.map(mapArray, calculate.calculateFantasyPoints, function (err, result) {
    if (err) {
      console.log(err);
    } else {
      callback(null, playerIds, result);
    }
  });
}

function getBetsPlayerId(playerIds, fantasyPointsArray, callback) {
  async.map(playerIds, getBetsFromPlayerId, function (err, result) {
    //result is an array of bet arrays
    if (err) {
      console.log(err);
    }
    else {
      callback(null, result, fantasyPointsArray);
    }
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
function processArrayBets(betsArray, fantasyPoints, callback) {
  var errCallback = function(err) {
    if (err) {
      console.log(err);
    }
  };

  console.log(betsArray, fantasyPoints);

  for (var i = 0; i !== betsArray.length; ++i) {
    var bets = betsArray[i];
    for (var j = 0; j !== bets.length; ++j) {
      calculateBet(bets[j], fantasyPoints[i], errCallback);
    }
  }
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
    getBetsPlayerId,
    //fourth waterfall function
    processArrayBets
    ], 
    function (err) {
      if (err) {
        console.log(err);
      }
    });
}

var checkEndGames = function(year, week) {
  //var rows;
  //sportsdata_nfl.getWeeklySchedule(week, function(err, schedule) {
    //if (err) {
      //console.log(err);
    //}
    //else {
      calculateAllFantasyPoints({"games":{"$":{"xmlns":"http://feed.elasticstats.com/schema/nfl/schedule-v1.0.xsd","season":"2013","type":"REG","week":"1"},"game":[{"$":{"id":"880d99e7-8c18-4a1a-882c-e0d96e8ecf15","scheduled":"2013-09-06T00:30:00+00:00","home_rotation":"","away_rotation":"","home":"DEN","away":"BAL","status":"closed"},"venue":[{"$":{"id":"6589e61d-ef1e-4e30-91b5-9acd2072b8a0","country":"US","name":"Sports Authority Field at Mile High","city":"Denver","state":"CO","capacity":"76125","surface":"turf","type":"outdoor","zip":"80204","address":"1701 Mile High Stadium Circle"}}],"weather":[{"$":{"temperature":"83","condition":"Mostly Cloudy, Light Rain","humidity":"30"},"wind":[{"$":{"speed":"7","direction":"NW"}}]}],"broadcast":[{"$":{"network":"NBC","satellite":"","internet":"","cable":""}}],"links":[{"link":[{"$":{"rel":"statistics","href":"/2013/REG/1/BAL/DEN/statistics.xml","type":"application/xml"}},{"$":{"rel":"summary","href":"/2013/REG/1/BAL/DEN/summary.xml","type":"application/xml"}},{"$":{"rel":"pbp","href":"/2013/REG/1/BAL/DEN/pbp.xml","type":"application/xml"}},{"$":{"rel":"boxscore","href":"/2013/REG/1/BAL/DEN/boxscore.xml","type":"application/xml"}},{"$":{"rel":"roster","href":"/2013/REG/1/BAL/DEN/roster.xml","type":"application/xml"}},{"$":{"rel":"injuries","href":"/2013/REG/1/BAL/DEN/injuries.xml","type":"application/xml"}},{"$":{"rel":"depthchart","href":"/2013/REG/1/BAL/DEN/depthchart.xml","type":"application/xml"}}]}]},{"$":{"id":"e036a429-1be6-4547-a99d-26602db584f9","scheduled":"2013-09-08T17:00:00+00:00","home_rotation":"","away_rotation":"","home":"NO","away":"ATL","status":"closed"},"venue":[{"$":{"id":"3c85d89a-ec66-4983-acd5-1381d6c8673a","country":"US","name":"Mercedes-Benz Superdome","city":"New Orleans","state":"LA","capacity":"73208","surface":"artificial","type":"dome","zip":"70112","address":"1500 Sugar Bowl Drive"}}],"weather":[{"$":{"temperature":"86","condition":"Partly Cloudy","humidity":"71"},"wind":[{"$":{"speed":"9","direction":"ENE"}}]}],"broadcast":[{"$":{"network":"FOX","satellite":"712","internet":"","cable":""}}],"links":[{"link":[{"$":{"rel":"statistics","href":"/2013/REG/1/ATL/NO/statistics.xml","type":"application/xml"}},{"$":{"rel":"summary","href":"/2013/REG/1/ATL/NO/summary.xml","type":"application/xml"}},{"$":{"rel":"pbp","href":"/2013/REG/1/ATL/NO/pbp.xml","type":"application/xml"}},{"$":{"rel":"boxscore","href":"/2013/REG/1/ATL/NO/boxscore.xml","type":"application/xml"}},{"$":{"rel":"roster","href":"/2013/REG/1/ATL/NO/roster.xml","type":"application/xml"}},{"$":{"rel":"injuries","href":"/2013/REG/1/ATL/NO/injuries.xml","type":"application/xml"}},{"$":{"rel":"depthchart","href":"/2013/REG/1/ATL/NO/depthchart.xml","type":"application/xml"}}]}]},{"$":{"id":"77c4d7dc-6196-4d58-864d-5e70e06e9070","scheduled":"2013-09-08T17:00:00+00:00","home_rotation":"","away_rotation":"","home":"PIT","away":"TEN","status":"closed"},"venue":[{"$":{"id":"7349a2e6-0ac9-410b-8bd2-ca58c9f7aa34","country":"US","name":"Heinz Field","city":"Pittsburgh","state":"PA","capacity":"65050","surface":"turf","type":"outdoor","zip":"15212","address":"100 Art Rooney Avenue"}}],"weather":[{"$":{"temperature":"73","condition":"Cloudy","humidity":"76"},"wind":[{"$":{"speed":"9","direction":"N"}}]}],"broadcast":[{"$":{"network":"CBS","satellite":"709","internet":"","cable":""}}],"links":[{"link":[{"$":{"rel":"statistics","href":"/2013/REG/1/TEN/PIT/statistics.xml","type":"application/xml"}},{"$":{"rel":"summary","href":"/2013/REG/1/TEN/PIT/summary.xml","type":"application/xml"}},{"$":{"rel":"pbp","href":"/2013/REG/1/TEN/PIT/pbp.xml","type":"application/xml"}},{"$":{"rel":"boxscore","href":"/2013/REG/1/TEN/PIT/boxscore.xml","type":"application/xml"}},{"$":{"rel":"roster","href":"/2013/REG/1/TEN/PIT/roster.xml","type":"application/xml"}},{"$":{"rel":"injuries","href":"/2013/REG/1/TEN/PIT/injuries.xml","type":"application/xml"}},{"$":{"rel":"depthchart","href":"/2013/REG/1/TEN/PIT/depthchart.xml","type":"application/xml"}}]}]},{"$":{"id":"b9d81c1f-fa7b-46b3-ada4-4354bc2a9909","scheduled":"2013-09-08T17:00:00+00:00","home_rotation":"","away_rotation":"","home":"NYJ","away":"TB","status":"closed"},"venue":[{"$":{"id":"5d4c85c7-d84e-4e10-bd6a-8a15ebecca5c","country":"US","name":"MetLife Stadium","city":"East Rutherford","state":"NJ","capacity":"82500","surface":"artificial","type":"outdoor","zip":"07073","address":"One MetLife Stadium Drive"}}],"weather":[{"$":{"temperature":"82","condition":"Sunny","humidity":"50"},"wind":[{"$":{"speed":"9","direction":"WNW"}}]}],"broadcast":[{"$":{"network":"FOX","satellite":"713","internet":"","cable":""}}],"links":[{"link":[{"$":{"rel":"statistics","href":"/2013/REG/1/TB/NYJ/statistics.xml","type":"application/xml"}},{"$":{"rel":"summary","href":"/2013/REG/1/TB/NYJ/summary.xml","type":"application/xml"}},{"$":{"rel":"pbp","href":"/2013/REG/1/TB/NYJ/pbp.xml","type":"application/xml"}},{"$":{"rel":"boxscore","href":"/2013/REG/1/TB/NYJ/boxscore.xml","type":"application/xml"}},{"$":{"rel":"roster","href":"/2013/REG/1/TB/NYJ/roster.xml","type":"application/xml"}},{"$":{"rel":"injuries","href":"/2013/REG/1/TB/NYJ/injuries.xml","type":"application/xml"}},{"$":{"rel":"depthchart","href":"/2013/REG/1/TB/NYJ/depthchart.xml","type":"application/xml"}}]}]},{"$":{"id":"268a558b-ca2a-418e-8f46-8e3ce202363d","scheduled":"2013-09-08T17:00:00+00:00","home_rotation":"","away_rotation":"","home":"BUF","away":"NE","status":"closed"},"venue":[{"$":{"id":"e9e0828e-37fc-4238-a317-49037577dd55","country":"US","name":"Ralph Wilson Stadium","city":"Orchard Park","state":"NY","capacity":"73079","surface":"artificial","type":"outdoor","zip":"14127","address":"1 Bills Drive"}}],"weather":[{"$":{"temperature":"65","condition":"Mostly Sunny","humidity":"55"},"wind":[{"$":{"speed":"11","direction":"NE"}}]}],"broadcast":[{"$":{"network":"CBS","satellite":"704","internet":"","cable":""}}],"links":[{"link":[{"$":{"rel":"statistics","href":"/2013/REG/1/NE/BUF/statistics.xml","type":"application/xml"}},{"$":{"rel":"summary","href":"/2013/REG/1/NE/BUF/summary.xml","type":"application/xml"}},{"$":{"rel":"pbp","href":"/2013/REG/1/NE/BUF/pbp.xml","type":"application/xml"}},{"$":{"rel":"boxscore","href":"/2013/REG/1/NE/BUF/boxscore.xml","type":"application/xml"}},{"$":{"rel":"roster","href":"/2013/REG/1/NE/BUF/roster.xml","type":"application/xml"}},{"$":{"rel":"injuries","href":"/2013/REG/1/NE/BUF/injuries.xml","type":"application/xml"}},{"$":{"rel":"depthchart","href":"/2013/REG/1/NE/BUF/depthchart.xml","type":"application/xml"}}]}]},{"$":{"id":"4869a6d0-4ef7-4712-a620-d10ffd8722d6","scheduled":"2013-09-08T17:00:00+00:00","home_rotation":"","away_rotation":"","home":"IND","away":"OAK","status":"closed"},"venue":[{"$":{"id":"6ed18563-53e0-46c2-a91d-12d73a16456d","country":"US","name":"Lucas Oil Stadium","city":"Indianapolis","state":"IN","capacity":"67000","surface":"artificial","type":"retractable_dome","zip":"46225","address":"500 South Capitol Avenue"}}],"weather":[{"$":{"temperature":"88","condition":"Partly Cloudy","humidity":"47"},"wind":[{"$":{"speed":"3","direction":"SE"}}]}],"broadcast":[{"$":{"network":"CBS","satellite":"707","internet":"","cable":""}}],"links":[{"link":[{"$":{"rel":"statistics","href":"/2013/REG/1/OAK/IND/statistics.xml","type":"application/xml"}},{"$":{"rel":"summary","href":"/2013/REG/1/OAK/IND/summary.xml","type":"application/xml"}},{"$":{"rel":"pbp","href":"/2013/REG/1/OAK/IND/pbp.xml","type":"application/xml"}},{"$":{"rel":"boxscore","href":"/2013/REG/1/OAK/IND/boxscore.xml","type":"application/xml"}},{"$":{"rel":"roster","href":"/2013/REG/1/OAK/IND/roster.xml","type":"application/xml"}},{"$":{"rel":"injuries","href":"/2013/REG/1/OAK/IND/injuries.xml","type":"application/xml"}},{"$":{"rel":"depthchart","href":"/2013/REG/1/OAK/IND/depthchart.xml","type":"application/xml"}}]}]},{"$":{"id":"be8f3ead-127f-4ccf-8882-006d18f93b7b","scheduled":"2013-09-08T17:00:00+00:00","home_rotation":"","away_rotation":"","home":"DET","away":"MIN","status":"closed"},"venue":[{"$":{"id":"6e3bcf22-277d-4c06-b019-62aded51654f","country":"US","name":"Ford Field","city":"Detroit","state":"MI","capacity":"65000","surface":"artificial","type":"dome","zip":"48226","address":"2000 Brush Street"}}],"weather":[{"$":{"temperature":"68","condition":"Sunny","humidity":"70"},"wind":[{"$":{"speed":"15","direction":"NE"}}]}],"broadcast":[{"$":{"network":"FOX","satellite":"710","internet":"","cable":""}}],"links":[{"link":[{"$":{"rel":"statistics","href":"/2013/REG/1/MIN/DET/statistics.xml","type":"application/xml"}},{"$":{"rel":"summary","href":"/2013/REG/1/MIN/DET/summary.xml","type":"application/xml"}},{"$":{"rel":"pbp","href":"/2013/REG/1/MIN/DET/pbp.xml","type":"application/xml"}},{"$":{"rel":"boxscore","href":"/2013/REG/1/MIN/DET/boxscore.xml","type":"application/xml"}},{"$":{"rel":"roster","href":"/2013/REG/1/MIN/DET/roster.xml","type":"application/xml"}},{"$":{"rel":"injuries","href":"/2013/REG/1/MIN/DET/injuries.xml","type":"application/xml"}},{"$":{"rel":"depthchart","href":"/2013/REG/1/MIN/DET/depthchart.xml","type":"application/xml"}}]}]},{"$":{"id":"5a28bf90-8f71-479d-9016-9dcd2ebea4c4","scheduled":"2013-09-08T17:00:00+00:00","home_rotation":"","away_rotation":"","home":"CAR","away":"SEA","status":"closed"},"venue":[{"$":{"id":"39be9ed4-3292-49ac-8699-a381de3a4969","country":"US","name":"Bank of America Stadium","city":"Charlotte","state":"NC","capacity":"73778","surface":"turf","type":"outdoor","zip":"28202","address":"800 South Mint Street"}}],"weather":[{"$":{"temperature":"87","condition":"Partly Cloudy","humidity":"48"},"wind":[{"$":{"speed":"7","direction":"N"}}]}],"broadcast":[{"$":{"network":"FOX","satellite":"711","internet":"","cable":""}}],"links":[{"link":[{"$":{"rel":"statistics","href":"/2013/REG/1/SEA/CAR/statistics.xml","type":"application/xml"}},{"$":{"rel":"summary","href":"/2013/REG/1/SEA/CAR/summary.xml","type":"application/xml"}},{"$":{"rel":"pbp","href":"/2013/REG/1/SEA/CAR/pbp.xml","type":"application/xml"}},{"$":{"rel":"boxscore","href":"/2013/REG/1/SEA/CAR/boxscore.xml","type":"application/xml"}},{"$":{"rel":"roster","href":"/2013/REG/1/SEA/CAR/roster.xml","type":"application/xml"}},{"$":{"rel":"injuries","href":"/2013/REG/1/SEA/CAR/injuries.xml","type":"application/xml"}},{"$":{"rel":"depthchart","href":"/2013/REG/1/SEA/CAR/depthchart.xml","type":"application/xml"}}]}]},{"$":{"id":"327f19da-5407-49bd-bcc8-298f69d99751","scheduled":"2013-09-08T17:00:00+00:00","home_rotation":"","away_rotation":"","home":"JAC","away":"KC","status":"closed"},"venue":[{"$":{"id":"4c5c036d-dd3d-4183-b595-71a43a97560f","country":"US","name":"EverBank Field","city":"Jacksonville","state":"FL","capacity":"67246","surface":"turf","type":"outdoor","zip":"32202","address":"One EverBank Field Drive"}}],"weather":[{"$":{"temperature":"85","condition":"Sunny","humidity":"55"},"wind":[{"$":{"speed":"10","direction":"NE"}}]}],"broadcast":[{"$":{"network":"CBS","satellite":"708","internet":"","cable":""}}],"links":[{"link":[{"$":{"rel":"statistics","href":"/2013/REG/1/KC/JAC/statistics.xml","type":"application/xml"}},{"$":{"rel":"summary","href":"/2013/REG/1/KC/JAC/summary.xml","type":"application/xml"}},{"$":{"rel":"pbp","href":"/2013/REG/1/KC/JAC/pbp.xml","type":"application/xml"}},{"$":{"rel":"boxscore","href":"/2013/REG/1/KC/JAC/boxscore.xml","type":"application/xml"}},{"$":{"rel":"roster","href":"/2013/REG/1/KC/JAC/roster.xml","type":"application/xml"}},{"$":{"rel":"injuries","href":"/2013/REG/1/KC/JAC/injuries.xml","type":"application/xml"}},{"$":{"rel":"depthchart","href":"/2013/REG/1/KC/JAC/depthchart.xml","type":"application/xml"}}]}]},{"$":{"id":"c91ae72a-289b-41c1-ae02-ce7d733bf9a1","scheduled":"2013-09-08T17:00:00+00:00","home_rotation":"","away_rotation":"","home":"CHI","away":"CIN","status":"closed"},"venue":[{"$":{"id":"d7866605-5ac6-4b3a-90e8-760cc5a26b75","country":"US","name":"Soldier Field","city":"Chicago","state":"IL","capacity":"61500","surface":"turf","type":"outdoor","zip":"60605","address":"1410 S Museum Campus Drive"}}],"weather":[{"$":{"temperature":"73","condition":"Cloudy","humidity":"79"},"wind":[{"$":{"speed":"11","direction":"ENE"}}]}],"broadcast":[{"$":{"network":"CBS","satellite":"705","internet":"","cable":""}}],"links":[{"link":[{"$":{"rel":"statistics","href":"/2013/REG/1/CIN/CHI/statistics.xml","type":"application/xml"}},{"$":{"rel":"summary","href":"/2013/REG/1/CIN/CHI/summary.xml","type":"application/xml"}},{"$":{"rel":"pbp","href":"/2013/REG/1/CIN/CHI/pbp.xml","type":"application/xml"}},{"$":{"rel":"boxscore","href":"/2013/REG/1/CIN/CHI/boxscore.xml","type":"application/xml"}},{"$":{"rel":"roster","href":"/2013/REG/1/CIN/CHI/roster.xml","type":"application/xml"}},{"$":{"rel":"injuries","href":"/2013/REG/1/CIN/CHI/injuries.xml","type":"application/xml"}},{"$":{"rel":"depthchart","href":"/2013/REG/1/CIN/CHI/depthchart.xml","type":"application/xml"}}]}]},{"$":{"id":"56e13273-73f7-4b57-8e79-e1b88268f32a","scheduled":"2013-09-08T17:00:00+00:00","home_rotation":"","away_rotation":"","home":"CLE","away":"MIA","status":"closed"},"venue":[{"$":{"id":"90c38d91-3774-4f5d-82ca-1c806828219f","country":"US","name":"FirstEnergy Stadium","city":"Cleveland","state":"OH","capacity":"71516","surface":"turf","type":"outdoor","zip":"44114","address":"100 Alfred Lerner Way"}}],"weather":[{"$":{"temperature":"70","condition":"Sunny","humidity":"80"},"wind":[{"$":{"speed":"13","direction":"NE"}}]}],"broadcast":[{"$":{"network":"CBS","satellite":"706","internet":"","cable":""}}],"links":[{"link":[{"$":{"rel":"statistics","href":"/2013/REG/1/MIA/CLE/statistics.xml","type":"application/xml"}},{"$":{"rel":"summary","href":"/2013/REG/1/MIA/CLE/summary.xml","type":"application/xml"}},{"$":{"rel":"pbp","href":"/2013/REG/1/MIA/CLE/pbp.xml","type":"application/xml"}},{"$":{"rel":"boxscore","href":"/2013/REG/1/MIA/CLE/boxscore.xml","type":"application/xml"}},{"$":{"rel":"roster","href":"/2013/REG/1/MIA/CLE/roster.xml","type":"application/xml"}},{"$":{"rel":"injuries","href":"/2013/REG/1/MIA/CLE/injuries.xml","type":"application/xml"}},{"$":{"rel":"depthchart","href":"/2013/REG/1/MIA/CLE/depthchart.xml","type":"application/xml"}}]}]},{"$":{"id":"6726b995-cb4c-4582-b729-fd9c21d063d2","scheduled":"2013-09-08T20:25:00+00:00","home_rotation":"","away_rotation":"","home":"STL","away":"ARI","status":"closed"},"venue":[{"$":{"id":"e86a743f-ee77-490f-acfb-3187b7a9633e","country":"US","name":"Edward Jones Dome","city":"St. Louis","state":"MO","capacity":"66000","surface":"artificial","type":"dome","zip":"63101","address":"701 Convention Plaza"}}],"weather":[{"$":{"temperature":"87","condition":"Cloudy","humidity":"0"},"wind":[{"$":{"speed":"0","direction":""}}]}],"broadcast":[{"$":{"network":"FOX","satellite":"714","internet":"","cable":""}}],"links":[{"link":[{"$":{"rel":"statistics","href":"/2013/REG/1/ARI/STL/statistics.xml","type":"application/xml"}},{"$":{"rel":"summary","href":"/2013/REG/1/ARI/STL/summary.xml","type":"application/xml"}},{"$":{"rel":"pbp","href":"/2013/REG/1/ARI/STL/pbp.xml","type":"application/xml"}},{"$":{"rel":"boxscore","href":"/2013/REG/1/ARI/STL/boxscore.xml","type":"application/xml"}},{"$":{"rel":"roster","href":"/2013/REG/1/ARI/STL/roster.xml","type":"application/xml"}},{"$":{"rel":"injuries","href":"/2013/REG/1/ARI/STL/injuries.xml","type":"application/xml"}},{"$":{"rel":"depthchart","href":"/2013/REG/1/ARI/STL/depthchart.xml","type":"application/xml"}}]}]},{"$":{"id":"2b972664-949e-4025-9f3d-48b3484674cd","scheduled":"2013-09-08T20:25:00+00:00","home_rotation":"","away_rotation":"","home":"SF","away":"GB","status":"closed"},"venue":[{"$":{"id":"6701808c-c329-482b-9834-2d29cb3185ff","country":"US","name":"Candlestick Park","city":"San Francisco","state":"CA","capacity":"69732","surface":"turf","type":"outdoor","zip":"94124","address":"602 Jamestown Avenue"}}],"weather":[{"$":{"temperature":"69","condition":"Sunny","humidity":"67"},"wind":[{"$":{"speed":"6","direction":"N"}}]}],"broadcast":[{"$":{"network":"FOX","satellite":"715","internet":"","cable":""}}],"links":[{"link":[{"$":{"rel":"statistics","href":"/2013/REG/1/GB/SF/statistics.xml","type":"application/xml"}},{"$":{"rel":"summary","href":"/2013/REG/1/GB/SF/summary.xml","type":"application/xml"}},{"$":{"rel":"pbp","href":"/2013/REG/1/GB/SF/pbp.xml","type":"application/xml"}},{"$":{"rel":"boxscore","href":"/2013/REG/1/GB/SF/boxscore.xml","type":"application/xml"}},{"$":{"rel":"roster","href":"/2013/REG/1/GB/SF/roster.xml","type":"application/xml"}},{"$":{"rel":"injuries","href":"/2013/REG/1/GB/SF/injuries.xml","type":"application/xml"}},{"$":{"rel":"depthchart","href":"/2013/REG/1/GB/SF/depthchart.xml","type":"application/xml"}}]}]},{"$":{"id":"05e9531d-e7e7-45c8-ae5a-91a2eb8acfa8","scheduled":"2013-09-09T00:30:00+00:00","home_rotation":"","away_rotation":"","home":"DAL","away":"NYG","status":"closed"},"venue":[{"$":{"id":"1e84213a-ff1f-4c9d-a003-8ee782b25a40","country":"US","name":"AT&T Stadium","city":"Arlington","state":"TX","capacity":"80000","surface":"artificial","type":"retractable_dome","zip":"76011","address":"One Legends Way"}}],"weather":[{"$":{"temperature":"96","condition":"Sunny","humidity":"28"},"wind":[{"$":{"speed":"11","direction":"S"}}]}],"broadcast":[{"$":{"network":"NBC","satellite":"","internet":"","cable":""}}],"links":[{"link":[{"$":{"rel":"statistics","href":"/2013/REG/1/NYG/DAL/statistics.xml","type":"application/xml"}},{"$":{"rel":"summary","href":"/2013/REG/1/NYG/DAL/summary.xml","type":"application/xml"}},{"$":{"rel":"pbp","href":"/2013/REG/1/NYG/DAL/pbp.xml","type":"application/xml"}},{"$":{"rel":"boxscore","href":"/2013/REG/1/NYG/DAL/boxscore.xml","type":"application/xml"}},{"$":{"rel":"roster","href":"/2013/REG/1/NYG/DAL/roster.xml","type":"application/xml"}},{"$":{"rel":"injuries","href":"/2013/REG/1/NYG/DAL/injuries.xml","type":"application/xml"}},{"$":{"rel":"depthchart","href":"/2013/REG/1/NYG/DAL/depthchart.xml","type":"application/xml"}}]}]},{"$":{"id":"e6aad620-bbaf-4510-96f0-d2e8086c256d","scheduled":"2013-09-09T22:55:00+00:00","home_rotation":"","away_rotation":"","home":"WAS","away":"PHI","status":"closed"},"venue":[{"$":{"id":"7c11bb2d-4a53-4842-b842-0f1c63ed78e9","country":"US","name":"FedEx Field","city":"Landover","state":"MD","capacity":"85000","surface":"turf","type":"outdoor","zip":"20785","address":"1600 FedEx Way"}}],"weather":[{"$":{"temperature":"80","condition":"Cloudy","humidity":"52"},"wind":[{"$":{"speed":"9","direction":"S"}}]}],"broadcast":[{"$":{"network":"ESPN","satellite":"206","internet":"","cable":""}}],"links":[{"link":[{"$":{"rel":"statistics","href":"/2013/REG/1/PHI/WAS/statistics.xml","type":"application/xml"}},{"$":{"rel":"summary","href":"/2013/REG/1/PHI/WAS/summary.xml","type":"application/xml"}},{"$":{"rel":"pbp","href":"/2013/REG/1/PHI/WAS/pbp.xml","type":"application/xml"}},{"$":{"rel":"boxscore","href":"/2013/REG/1/PHI/WAS/boxscore.xml","type":"application/xml"}},{"$":{"rel":"roster","href":"/2013/REG/1/PHI/WAS/roster.xml","type":"application/xml"}},{"$":{"rel":"injuries","href":"/2013/REG/1/PHI/WAS/injuries.xml","type":"application/xml"}},{"$":{"rel":"depthchart","href":"/2013/REG/1/PHI/WAS/depthchart.xml","type":"application/xml"}}]}]},{"$":{"id":"7dd862f9-21d6-4768-89f8-f82929ae575c","scheduled":"2013-09-10T02:20:00+00:00","home_rotation":"","away_rotation":"","home":"SD","away":"HOU","status":"closed"},"venue":[{"$":{"id":"7ca47702-8951-45be-a4f5-3e7d78f8f399","country":"US","name":"Qualcomm Stadium","city":"San Diego","state":"CA","capacity":"70561","surface":"turf","type":"outdoor","zip":"92108","address":"9449 Friars Road"}}],"weather":[{"$":{"temperature":"70","condition":"Partly Cloudy","humidity":"73"},"wind":[{"$":{"speed":"10","direction":"WNW"}}]}],"broadcast":[{"$":{"network":"ESPN","satellite":"206","internet":"","cable":""}}],"links":[{"link":[{"$":{"rel":"statistics","href":"/2013/REG/1/HOU/SD/statistics.xml","type":"application/xml"}},{"$":{"rel":"summary","href":"/2013/REG/1/HOU/SD/summary.xml","type":"application/xml"}},{"$":{"rel":"pbp","href":"/2013/REG/1/HOU/SD/pbp.xml","type":"application/xml"}},{"$":{"rel":"boxscore","href":"/2013/REG/1/HOU/SD/boxscore.xml","type":"application/xml"}},{"$":{"rel":"roster","href":"/2013/REG/1/HOU/SD/roster.xml","type":"application/xml"}},{"$":{"rel":"injuries","href":"/2013/REG/1/HOU/SD/injuries.xml","type":"application/xml"}},{"$":{"rel":"depthchart","href":"/2013/REG/1/HOU/SD/depthchart.xml","type":"application/xml"}}]}]}]}}
, year, week);
    //}
  //});
};

checkEndGames(2013, 1);
//async.map schedules -> closed schedules
//async.map closed schedules -> player objects
//async.each player objects -> get bets and update
//app.listen(3000);

//sportsdata_nfl.getWeeklySchedule(1, function(err, schedule) {
  //console.log(JSON.stringify(schedule));
//});

//sportsdata_nfl.getGameStats(1, 'BAL', 'DEN', function(err, schedule) {
  //console.log(JSON.stringify(schedule));
//});
//tests
//for calculating fantasy points
/*calculate.calculateFantasyPoints('Andre Johnson', 'HOU', 'SD', false, '2013', 1, function(err, result) {
  if (err) {
    console.log(err);
    return;
  }
  console.log(result);
});*/
