'use strict';
require('rootpath')();

var timeseriesBets = require('libs/cassandra/timeseriesBets');
var DEFAULTID = 'hello';

//query between lastUpdate and now and send to client
//get'/update'
var updateGraph = function(req, res, next){
  var lastUpdate = new Date(req.query.lastUpdate);
  var player_id = req.query.player_id || DEFAULTID;
  timeseriesBets.selectSinceTime(player_id, lastUpdate, function (err, result) {
    if (err) {
      next(err);
    } else {
      res.send(result);
    }
  });
}

//get '/data'
var getData = function(req, res, next) {
  var prevDay = new Date();
  prevDay = new Date(prevDay.setDate(prevDay.getDate() - 1));
  //console.log(prevDay);
  var player_id = req.query.player_id || DEFAULTID;
  timeseriesBets.selectSinceTime(player_id, prevDay, function(err, result) {
    if (err) {
      next(err);
    } else {
      res.send(result);
    }
  });
}

exports.update = updateGraph;
exports.get = getData;