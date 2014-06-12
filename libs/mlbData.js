require('rootpath')();
var express = require('express');
var app = module.exports = express();
var configs = require('config/index');
configs.configure(app);

var cql = configs.cassandra.cql;
var client = configs.cassandra.client;
var request = require('request');
var xml2js = require('xml2js');
var parser = new xml2js.Parser();
var urlHelper = require('../libs/url_helper_mlb');

app.use('/', require('../app.js'));

var sportsdata_mlb = require('sportsdata').MLB;

sportsdata_mlb.init('t', 4, 'f8rhpkpxsxdvhzrr3vmxn8wk', 2014, 'REG');

/*
sportsdata_mlb.get3DaySchedule(function(err, result) {
  if (!err) {
    console.log(result.outlook.schedules[0].event[12].$.id)
  }
})*/

function createRequest(url, callback) {

    request(url, function (error, response, body) {

        if (!error && response.statusCode == 200) {

            // Parse the XML to JSON
            parser.parseString(body, function (err, result) {
                callback(err, result);
            });
        } else {
            callback(error, body);
        }
    });
}

/*function getDailyBoxscore(year, month, day, callback) {
  var url = urlHelper.getDailyBoxscoreUrl(year, month, day);
  createRequest(url, callback);
}

getDailyBoxscore('2014', '05', '16', function(err, result) {
  if (err) {
    console.log(err);
  }
  else {
    console.log(result.boxscores.boxscore[0].home[0].$);
  }
})*/

function getGameStatistics(event, callback) {
  var url = urlHelper.getGameStatisticsUrl(event);
  createRequest(url, callback);
}
/*
var calculateMlbFantasyPoints = function(PlayerObject, callback) {
  var playerName = playerObject.player;

}*/
getGameStatistics('097b2e74-75a9-4fa2-86a8-0dce732751b0', function(err, result) {
  if (err) {
    console.log(err);
  }
  else {
    console.log(result.statistics.home[0].hitting[0].players[0].player[0].games[0])
  }
})

function get3DaySchedule(callback) {
  var url = urlHelper.get3DayScheduleUrl();
  createRequest(url, callback);
}
/*
function getGameBoxscore(event, callback) {
  var url = urlHelper.getGameBoxscoreUrl(event);
  createRequest(url, callback);
}

getGameBoxscore('097b2e74-75a9-4fa2-86a8-0dce732751b0', function(err, result) {
  if (err) {
    console.log(err);
  }
  else {
    console.log(result.boxscore.home[0]);
  }
})*/