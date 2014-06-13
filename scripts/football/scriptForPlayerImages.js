require('rootpath')();
var express = require('express');
var app = module.exports = express();
var configs = require('config/index');
configs.configure(app);

var cql = configs.cassandra.cql;
var client = configs.cassandra.client;

app.use('/', require('../app.js'));

var sportsdata_nfl = require('sportsdata').NFL;
var sportsdata_mlb = require('sportsdata').MLB;
var async = require('async');

var request = require('request');
var xml2js = require('xml2js');
var parser = new xml2js.Parser();
var urlHelper = require('../libs/url_helper_mlb');
var urlHelper2 = require('../libs/url_helper_nfl')  //change name later

sportsdata_nfl.init('t', 1, 'gzjpc3dseum9ps25td2y6mtx', 2013, 'REG');
sportsdata_mlb.init('t', 4, 'f8rhpkpxsxdvhzrr3vmxn8wk', 2014, 'REG');

function createRequest(url, callback) {
  request(url, function(error, response, body) {
    if (!error && response.statusCode == 200) {

      parser.parseString(body, function(err, result) {
        callback(err, result);
      });
    }
    else {
      callback(error, body);
    }
  });
}

function getPlayerImages(callback) {
  var url = urlHelper2.getPlayerManifestsUrl();
  createRequest(url, callback);
}
/*
function insertImages(i, callback) {
  getPlayerImages(function(err, result) {
    var urltemp = result.assetlist.asset[i].links[0].link[0].$.href
    var url = 'http://api.sportsdatallc.org/nfl-images-t2/usat' + urltemp + '?api_key=3khf4k9vsw7tmkzf7f56ej8u';
    var player = result.assetlist.asset[i].title[0];
    var query = 'INSERT INTO player_images (player_name, image_url) VALUES (?, ?)'
    var params = [player, url];
    client.executeAsPrepared(query, params, cql.types.consistencies.one, callback)
  })
}


function insertAll() {
  var length = 240;
  var arr = new Array(length);
  for (var i = 0; i < length; i++) {
    arr[i] = i;
  }
  var callback = function(err) {
    if (!err) {
      console.log('Success')
    }
  };
  async.eachSeries(
    arr,
    function(i, callback) {
      insertImages(i, callback)
    },
    callback
  );
}

insertAll();
*/