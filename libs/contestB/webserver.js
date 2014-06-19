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
var async = require('async');
var Player = require('../libs/cassandra/baseballPlayer.js');
//app.use('/', require('../app.js'));
var Bet = require('../libs/cassandra/bet.js');
var User = require('../libs/cassandra/user.js');
var ContestB = require('../libs/cassandra/contestB.js');
var contestBModes = require('configs/contestBModes');

var sportsdataMlb = require('sportsdata').MLB;

var createContest = function(type, sport, deadlineTime) {
  var allowedTypes = ['Type 1'];
  var athletes = selectContestAthletes(sport, deadlineTime);
  var settings = null;

  if (allowedTypes.indexOf(type) < 0) {
    return new Error(type + ' is not an allowed contest type.');
  }
  else if (type === 'Type 1') {
    settings = contestBModes.createType1Settings(athletes, deadlineTime, sport);


  }
  else {
    return new Error(type + ' not yet implemented.');
  }
}

var addUser = function(userId, contestId) {

}

var removeAndRefundUser = function(userId, contestId) {

}

app.get('/', createContest);

app.listen(3000);