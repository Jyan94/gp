'use strict';
(require('rootpath')());
var importedapp = require('app.js');
var express = require('express');
var app = express();
var configs = require('config/index');
configs.configure(app);
app.use('/', importedapp);

var client = configs.cassandra.client;
var cql = configs.cassandra.cql;

app.get('/autocomp', function(req,res) {
  var search =[];
  var query = 'SELECT player_id, full_name FROM football_player';
  client.executeAsPrepared(query, cql.types.consistencies.one,
    function(err, result) {
    if (err) {
      console.log(err);
    }
    else {
      var rows = result.rows;
      if (rows[0]) {
        for (var i = 0; i < rows.length; i++) {
          search[i] = {
            label: rows[i].full_name,
            player_id: rows[i].player_id
          };
        }
      }
      res.send(JSON.stringify(search));
    }
  });
});

app.get('/hello', function(req, res) {
  console.log(req.query);
});

app.get('/', function(req, res) {
  res.render('banner');
});
app.listen(3000);