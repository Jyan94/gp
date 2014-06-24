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
var BaseballStatistics = require('../libs/cassandra/baseballStatistics');

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
  console.log(url);
  createRequest(url, callback);
}

function getDailyEventInfoAndLineups(year, month, day, callback) {
  var url = urlHelper.getDailyEventInfoAndLineups(year, month, day);
  createRequest(url, callback);
}

function getDailyBoxscore(year, month, day, callback) {
  var url = urlHelper.getDailyBoxscoreUrl(year, month, day);
  createRequest(url, callback);
}

function updateOrInsert(gameId, startTime, date, homeName,
  visitorName, homeScore, visitorScore, status, callback) {
    var fields = [];
    BaseballStatistics.selectGameUsingId(gameId, function(err, result) {
    if (result) {
      console.log("2");
      console.log(startTime);
      console.log(homeScore);
      console.log(visitorScore);
      console.log(status);
      console.log(gameId);
      fields = [
        startTime,
        homeScore,
        visitorScore,
        status,
        gameId
      ]
      BaseballStatistics.updateGameSchedule(fields, function(err) {
        if (err) {
          console.log("failed")
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
      gameId, //game id
      startTime, //start time of the game
      date, //date of game !!!should fix
      homeName, //home team name
      visitorName, //visitor team name
      homeScore, //no home score yet
      visitorScore, //no away score yet
      status, //status = scheduled
      ];
      BaseballStatistics.insertGameSchedule(fields, function(err) {
        if (err) {
          console.log("failed inserted")
          callback(err);
        }
        else {
          console.log("Successfully Inserted")
        }
      })
    }
  })
}
function insertNameAndScore(boxscore, callback) {

  var gameId = boxscore.$.id;
  var startTime;
  var date = boxscore.date;
  var homeName = boxscore.home[0].$.abbr;
  var visitorName = boxscore.visitor[0].$.abbr;
  var homeScore;
  var visitorScore;
  var status = boxscore.$.status;
  var fields = [];

  if (status === 'scheduled') {
    homeScore = null;
    visitorScore = null;
    getEventInfoAndLineups(boxscore.$.id, function(err, result) {
      var tmpStartTime = result.event.scheduled_start_time[0];
      startTime = String(new Date(tmpStartTime)).split(" ")[4];
      updateOrInsert(gameId, startTime, date, homeName, visitorName, homeScore, visitorScore, status, callback);
    });
  }
  else {
    startTime = null;
    homeScore = boxscore.home[0].$.runs;
    visitorScore = boxscore.visitor[0].$.runs;
    updateOrInsert(gameId, startTime, date, homeName, visitorName, homeScore, visitorScore, status, callback);
  }
}

var getEachBoxScore = function(year, month, day, callback) {
  getDailyBoxscore(year, month, day, function(err, result) {

    if (!result.hasOwnProperty('boxscores')) {
      console.log(result);
      setTimeout(function () { getEachBoxScore(year, month, day, callback); }, 1001);
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

function calculateBoxScore() {
  setInterval(function() {
    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;
    var day = date.getDate();
    day = (day < 10 ? "0" : "") + day;

    getEachBoxScore(year, month, day)
  }, 3600000);
}

calculateBoxScore();


exports.createRequest = createRequest;
exports.getPlayByPlay = getPlayByPlay;
//exports.getPlayByPlayForGame = getPlayByPlayForGame;
exports.getEventInfoAndLineups = getEventInfoAndLineups;
exports.getDailyEventInfoAndLineups = getDailyEventInfoAndLineups;
exports.getDailyBoxscore = getDailyBoxscore;
exports.getEachBoxScore = getEachBoxScore;