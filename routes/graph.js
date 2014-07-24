'use strict';
require('rootpath')();

var TimeseriesBets = require('libs/cassandra/contestA/timeseries');
var DEFAULTID = '00000000-0000-0000-0000-000000000000';

//query between lastUpdate and now and send to client
//get '/update'
var updateGraph = function(req, res){
  var lastUpdate = new Date(req.query.lastUpdate);
  var athleteId = req.query.athleteId || DEFAULTID;
  TimeseriesBets.selectSinceTime(athleteId, lastUpdate, function (err, result) {
    if (err) {
      res.send([]);
    } 
    else {
      res.send(result);
    }
  });
}

//get '/data'
var getData = function(req, res) {
  var prevDay = new Date();
  prevDay = new Date(prevDay.setDate(prevDay.getDate() - 1));
  var athleteId = req.query.athleteId || DEFAULTID;
  TimeseriesBets.selectSinceTime(athleteId, prevDay, function(err, result) {
    if (err) {
      res.send([]);
    } 
    else {
      res.send(result);
    }
  });
}

exports.update = updateGraph;
exports.get = getData;