require('rootpath')();
//var express = require('express');
//var app = module.exports = express();
var configs = require('config/index');
//configs.configure(app);

var cql = configs.cassandra.cql;
var client = configs.cassandra.client;
var request = require('request');
var xml2js = require('xml2js');
var parser = new xml2js.Parser();
var urlHelper = require('../libs/url_helper_mlb');
var async = require('async');
var BaseballStatistics = require('libs/cassandra/baseball/game.js');

function createRequest(url, callback) {
  console.log(url);
  request(url, function (error, response, body) {
    if (!error && (response.statusCode === 200)) {

        // Parse the XML to JSON
        parser.parseString(body, function (err, result) {
            callback(err, result);
        });
    } else {
        console.log("code error: " + response.statusCode);
        callback(error, body);
    }
  });
}

function getPlayByPlay(event, callback) {
  var url = urlHelper.getPlayByPlayUrl(event);
  createRequest(url, callback);
}

/*function getPlayByPlayForGame(event, callback) {
  getPlayByPlay('000c465f-7c8c-46bb-8ea7-c26b2bc7c296', function(err, result) {
    var retArr = [];
    var prefixInning = result.play_by_play.inning
    var length = prefixInning.length;
    console.log(prefixInning[7].inning_half[1].at_bat[0].description);
    for (var i = length - 1; i >= 0; i--) {
      var currentHalves = prefixInning[i].inning_half
      var halvesLength = currentHalves.length
      for (var j = halvesLength - 1; j >= 0; j--) {
        if (currentHalves[j].at_bat !== undefined) {
          var atbatLength = currentHalves[j].at_bat.length;
          if (atbatLength > 0 ) {
            for (var k = atbatLength - 1; k >= 0; k--) {
              var description = result.play_by_play.inning[i].inning_half[j].at_bat[k].description;
              if (description !== undefined) {
                retArr.push(description[0]);
              }
            }
          }
        }
      }
    }
    callback(null, retArr);
  });
}*/

function getEventInfoAndLineups(event_id, callback) {
  var url = urlHelper.getEventInfoAndLineups(event_id);
  createRequest(url, callback);
}
/*
getEventInfoAndLineups('000c465f-7c8c-46bb-8ea7-c26b2bc7c296', function(err, result) {
  if (err) {
    console.log(err);
  }
  else {
    console.log(result.event.game[0].visitor[0].roster[0].player[0]);
  }
})
*/
function getDailyEventInfoAndLineups(year, month, day, callback) {
  var url = urlHelper.getDailyEventInfoAndLineups(year, month, day);
  createRequest(url, callback);
}

function getDailyBoxscore(year, month, day, callback) {
  var url = urlHelper.getDailyBoxscoreUrl(year, month, day);
  createRequest(url, callback);
}

function updateOrInsert(
  gameId,
  startTime,
  date,
  homeId,
  shortHomeName,
  longHomeName,
  visitorId,
  shortVisitorName,
  longVisitorName,
  homeScore,
  visitorScore,
  status,
  playerList,
  callback) {
    var fields = [];
    BaseballStatistics.select(gameId, function(err, result) {
      console.log('result: ' + result);
    if (result) {
      console.log("2");
      console.log('startTime: ' + startTime);
      console.log('homeScore: ' + homeScore);
      console.log('visitorScore: ' + visitorScore);
      console.log('status: ' + status);
      console.log('gameId: ' + gameId);
      console.log('date: ' + date);
      console.log('playerList: ' + playerList);
      console.log('shortVisitorName: ' + shortVisitorName);
      console.log('longVisitorName: ' + longVisitorName);
      console.log('shortHomeName: ' + shortHomeName);
      console.log('shortVisitorName: ' + shortVisitorName);
      fields = [ {
        start_time: startTime,
        status: status,
        home_score: homeScore,
        away_score: visitorScore,
        }
      ];
      BaseballStatistics.update(fields, function(err) {
        if (err) {
          console.log("failed Updating: " + err);
          callback(err);
        }
        else {
          console.log("Successfully Updated")
        }
      })
    }
    else {
      console.log("1");
      fields = [
      visitorScore, //away_score
      null, //end_time
      gameId, //game id
      date, //game_date
      homeScore, //home_score
      longVisitorName, // long_away_name
      longHomeName, //long_home_name
      playerList, //player
      null, // no play_by_plays for now -------------
      shortVisitorName, //short_away_name
      shortHomeName, //short_home_name
      startTime, //start time of the game
      status //status = scheduled
      ];
      BaseballStatistics.insert(fields, function(err) {
        if (err) {
          console.log("failed inserted: " + err);
          callback(err);
        }
        else {
          console.log("Successfully Inserted");
        }
      })
    }
  })
}
function insertNameAndScore(boxscore, callback) {

  var gameId = boxscore.$.id;
  var startTime;
  var date = boxscore.date;

  var homeId = boxscore.home[0].$.id
  var shortHomeName = boxscore.home[0].$.abbr;
  var longHomeName = boxscore.home[0].$.name;

  var visitorId = boxscore.visitor[0].$.id;
  var shortVisitorName = boxscore.visitor[0].$.abbr;
  var longVisitorName = boxscore.visitor[0].$.name;

  var homeScore;
  var visitorScore;
  var status = boxscore.$.status;
  var fields = [];

  if (status === 'scheduled') {
    homeScore = null;
    visitorScore = null;
    getEventInfoAndLineups(boxscore.$.id, function(err, result) {
      if ((result === undefined) || !(result.hasOwnProperty('event'))) {
        setTimeout(function() {
          insertNameAndScore(boxscore, callback);
        },
      6001)}
      console.log(result);
      var tmpStartTime = result.event.scheduled_start_time[0];
      startTime = String(new Date(tmpStartTime)).split(" ")[4];
      var playerList = [];

      var visitorRosterPrefix = result.event.game[0].visitor[0].roster[0].player;
      for (var i = 0; i < visitorRosterPrefix.length; i++) {
        playerList.push(JSON.stringify({
          athleteId: visitorRosterPrefix[i].$.id,
          athleteName: visitorRosterPrefix[i].$.preferred_name + " " + visitorRosterPrefix[i].$.last_name,
          isOnHomeTeam: false,
          shortTeamName: shortVisitorName,
          longTeamName: longVisitorName,
          teamId: visitorId
        }));
      }
      var homeRosterPrefix = result.event.game[0].home[0].roster[0].player;
      for (var j = 0; j < homeRosterPrefix.length; j++) {
        playerList.push(JSON.stringify({
          athleteId: homeRosterPrefix[j].$.id,
          athleteName: homeRosterPrefix[j].$.preferred_name + " " + homeRosterPrefix[j].$.last_name,
          isOnHomeTeam: true,
          shortTeamName: shortHomeName,
          longTeamName: longHomeName,
          teamId: homeId
        }));
      }

      updateOrInsert(gameId,
        startTime,
        date,
        homeId,
        shortHomeName,
        longHomeName,
        visitorId,
        shortVisitorName,
        longVisitorName,
        homeScore,
        visitorScore,
        status,
        playerList,
        callback);
    });
  }
  else {
    startTime = null;
    homeScore = parseInt(boxscore.home[0].$.runs);
    visitorScore = parseInt(boxscore.visitor[0].$.runs);
    updateOrInsert(gameId,
      startTime,
      date,
      homeId,
      shortHomeName,
      longHomeName,
      visitorId,
      shortVisitorName,
      longVisitorName,
      homeScore,
      visitorScore,
      status,
      null, //playerlist is not necessary since it's already inserted before
      callback);
  }
}

var getEachBoxScore = function(year, month, day, callback) {
  getDailyBoxscore(year, month, day, function(err, result) {
    if (!result.hasOwnProperty('boxscores')) {
      setTimeout(function () { getEachBoxScore(year, month, day, callback); }, 6001);
    }
    else {
      var boxscore = result.boxscores.boxscore;
      for (var i = 0; i !== boxscore.length; ++i) {
        boxscore[i].date = '' + year +'/' + month + "/" + day;
      }
      async.map(boxscore, insertNameAndScore, function(err) {
        if (err) {
          console.log(err);
        }
        else {
          console.log("Successfully Inserted");
        }
      });
    }
  });
}
/*
getEachBoxScore('2014', '07', '08', function(err, result) {
  console.log(result);
})
*/
function calculateBoxScore() {
  setInterval(function() {
    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;
    var day = date.getDate();
    day = (day < 10 ? "0" : "") + day;

    getEachBoxScore(year, month, day)
  }, 360000);
}


exports.createRequest = createRequest;
exports.getPlayByPlay = getPlayByPlay;
//exports.getPlayByPlayForGame = getPlayByPlayForGame;
exports.getEventInfoAndLineups = getEventInfoAndLineups;
exports.getDailyEventInfoAndLineups = getDailyEventInfoAndLineups;
exports.getDailyBoxscore = getDailyBoxscore;
exports.getEachBoxScore = getEachBoxScore;