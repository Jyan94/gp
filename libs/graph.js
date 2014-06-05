require('rootpath')();
var express = require('express');
var app = module.exports = express();
var configs = require('config/index');
configs.configure(app);

var timeseriesBets = require('libs/cassandra/timeseriesBets');
var DEFAULTID = 'hello';

//get time series data from cassandra
//format
app.get('/', function(req, res){
  res.render('graph');
});

//query between lastUpdate and now and send to client
app.get('/update', function(req, res){
  var lastUpdate = new Date(req.query.lastUpdate);
  var player_id = req.query.player_id || DEFAULTID;
  timeseriesBets.selectSinceTime(player_id, lastUpdate, function (err, result) {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

app.get('/data', function(req, res) {
  var prevDay = new Date();
  prevDay = new Date(prevDay.setDate(prevDay.getDate() - 1));
  //console.log(prevDay);
  var player_id = req.query.player_id || DEFAULTID;
  console.log(req.query.player_id);
  timeseriesBets.selectSinceTime(player_id, prevDay, function(err, result) {
    if (err) {
      console.log(err);
      res.send(500);
    } else {
      res.send(result);
    }
  });
});


// tests
/*
setInterval(function() {
  timeseriesBets.insert('hello', Math.random() * 100, function(err) {
    if (err) {
      console.log(err);
    }
  });
}, 1000);
app.listen(3000);
*/
