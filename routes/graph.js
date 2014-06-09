'use strict';
require('rootpath')();

var TimeseriesBets = require('libs/cassandra/timeseriesBets');
var DEFAULTID = 'hello';

//query between lastUpdate and now and send to client
//get '/update'
var updateGraph = function(req, res){
  var lastUpdate = new Date(req.query.lastUpdate);
  var playerId = req.query.playerId || DEFAULTID;
  TimeseriesBets.selectSinceTime(playerId, lastUpdate, function (err, result) {
    if (err) {
      res.send([]);
    } else {
      res.send(result);
    }
  });
}

//get '/data'
var getData = function(req, res) {
  var prevDay = new Date();
  prevDay = new Date(prevDay.setDate(prevDay.getDate() - 1));
  var playerId = req.query.playerId || DEFAULTID;
  TimeseriesBets.selectSinceTime(playerId, prevDay, function(err, result) {
    if (err) {
      res.send([]);
    } else {
      res.send(result);
    }
  });
}

exports.update = updateGraph;
exports.get = getData;