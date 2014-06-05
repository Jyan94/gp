'use strict';
(require('rootpath')());

var cassandra = require('libs/cassandra/cql');
var cql = require('config/index.js').cassandra.cql;
var multiline = require('multiline');

var GET_BETS_FROM_PLAYER_ID_CQL = multiline(function() {/*
  SELECT bet_id FROM current_bets WHERE player_id = ?
*/});

//returns a list of bets for a given player id
function getBetIdsFromPlayerId(playerId, callback) {
  cassandra.query(
    GET_BETS_FROM_PLAYER_ID_CQL, 
    [playerId], 
    cql.types.consistencies.one,
    function(err, result) {
      if (err) {
        console.log(err);
      } else {
        callback(null, result.rows);
      }
    });
}

