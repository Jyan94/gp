'use strict';
(require('rootpath')());
var importedapp = require('app.js');
var express = require('express');
var app = express();
var configs = require('config/index');
configs.configure(app);
app.use('/', importedapp);

var client = configs.client;
var cql = configs.cql;

app.get('/autocomplete', function(req,res) {
  console.log('woohoo');
  var search =[];
  var query = 'SELECT player_id, first_name, last_name FROM players';
  client.executeAsPrepared(query, cql.types.consistencies.one, function(err, result) {
    if (err) {
      console.log(err);
    }
    else {
      var rows = result.rows;
      if (rows[0]) {
        for (var i = 0; i < rows.length; i++) {
          search[i] = {
            label: rows[i].first_name + ' ' + rows[i].last_name,
            player_id: rows[i].player_id
          };
        }
      }
      res.send(JSON.stringify(search));
    }
  });
});

app.get('/', function(req, res) {
  res.render('market', {betinfo : []});
});
app.listen(3000);