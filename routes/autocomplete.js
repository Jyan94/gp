'use strict';
(require('rootpath')());
var configs = require('config/index');
var Player = require('libs/cassandra/player');
/*
var client = configs.cassandra.client;
var cql = configs.cassandra.cql;
*/

//get autocomp
var autocomp = function(req, res, next) {
  var search =[];
  Player.selectAllPlayerNames(function(err, result) {
    if (err) {
      next(err);
    } else {
      if (result) {
        for (var i = 0; i < result.length; i++) {
          search[i] = {
            label: result[i].full_name,
            playerId: result[i].player_id
          };
        }
      }
      res.send(JSON.stringify(search));
    }
  });
  /*
  var query = 'SELECT player_id, full_name FROM football_player';
  client.executeAsPrepared(query, cql.types.consistencies.one,
    function(err, result) {
    if (err) {
      next(err);
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
*/

};

exports.autocomp = autocomp;