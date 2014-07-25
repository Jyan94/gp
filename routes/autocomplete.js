/*'use strict';
(require('rootpath')());
var configs = require('config/index');
var Player = require('libs/cassandra/baseballPlayer');

//get autocomp
var autocomp = function(req, res, next) {
  var search =[];
  Player.selectAllPlayerNames(function(err, result) {
    if (err) {
      next(err);
    }
    else {
      if (result) {
        for (var i = 0; i < result.length; i++) {
          search[i] = {
            label: result[i].full_name,
            athleteId: result[i].athlete_id
          };
        }
      }
      res.send(JSON.stringify(search));
    }
  });
};

exports.autocomp = autocomp;*/