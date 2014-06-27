'use strict';
(require('rootpath')());

var express = require('express');
var app = module.exports = express();
var configs = require('config/index');
configs.configure(app);

var async = require('async');
var Bet = require('libs/cassandra/bet');
var User = require('libs/cassandra/user');
var cql = configs.cassandra.cql;

var messages = configs.constants.tournamentStrings;

var renderTournamentTablesPage = function (req, res) {
  if (req.user) {
    res.render('tournamenttables.hbs');
  }
  else {
    res.render('tournamenttables.hbs');
  }
}

var renderTournamentEntryPage = function (req, res) {
  if (req.user) {
    res.render('tournamentEntry.hbs', {link: 'logout',
                                       display: 'Logout'});
  }
  else {
    res.render('tournamentEntry.hbs', {link: 'logout',
                                       display: 'Logout'});
  }
}

app.get('/tournament', renderTournamentTablesPage);
app.listen(3000);