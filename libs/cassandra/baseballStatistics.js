'use strict';
require('rootpath')();

var cassandra = require('libs/cassandra/cql');
var cql = require('config/index.js').cassandra.cql;
var multiline = require('multiline');

/**
 * 
CREATE TABLE IF NOT EXISTS baseball_player_game_statistics (
  game_id uuid PRIMARY KEY,
  player_id uuid,
  sport text,
  date timestamp,
  season_year int,
  season_type text,
  position_in_game text,
  singles int,
  doubles int,
  triples int,
  home runs int,
  runs int,
  rbis int,
  stolen_bases int,
  caught_stealing_bases int,
  walks int,
  earned_runs_allowed int,
  strikeouts int,
  walks_and_hits_allowed int,
  fantasy_points double
);
 */
