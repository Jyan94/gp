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

function getNameAndScore(boxscore, callback) {
  var retVal;

  if (boxscore.$.status === 'scheduled') {
    getEventInfoAndLineups(boxscore.$.id, function(err, result) {
    
      if ((result === undefined) || !(result.hasOwnProperty('event'))) {
        setTimeout(function() {
          getNameAndScore(boxscore, callback);
        }, 1001);
      }
      else {
        var startTime = result.event.scheduled_start_time[0];
        retVal = {
          'homeName': boxscore.home[0].$.abbr,
          'visitorName': boxscore.visitor[0].$.abbr,
          'startTime': startTime
        }
        console.log('retVal: ' + retVal);
        callback(null, retVal);
      }
    });
  }
  else {
    retVal = {
      'homeName': boxscore.home[0].$.abbr,
      'homeScore': boxscore.home[0].$.runs,
      'visitorName': boxscore.visitor[0].$.abbr,
      'visitorScore': boxscore.visitor[0].$.runs
    }

    console.log('retVal: ' + retVal);
    callback(null, retVal);
  }
}

var getEachBoxScore = function(year, month, day, callback) {
  getDailyBoxscore(year, month, day, function(err, result) {

    if (!result.hasOwnProperty('boxscores')) {
      console.log(result);
      setTimeout(function () { getEachBoxScore(year, month, day, callback); }, 1001);
    }
    else {
      async.map(result.boxscores.boxscore, getNameAndScore, function(err, result) {
        if (err) {
          console.log(err);
        }
        else {
          callback(null, result);
        }
      });
    }
  });
}

exports.createRequest = createRequest;
exports.getPlayByPlay = getPlayByPlay;
//exports.getPlayByPlayForGame = getPlayByPlayForGame;
exports.getEventInfoAndLineups = getEventInfoAndLineups;
exports.getDailyEventInfoAndLineups = getDailyEventInfoAndLineups;
exports.getDailyBoxscore = getDailyBoxscore;
exports.getNameAndScore = getNameAndScore;
exports.getEachBoxScore = getEachBoxScore;