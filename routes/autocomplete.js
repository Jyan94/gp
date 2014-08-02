'use strict';
(require('rootpath')());
var configs = require('config/index');
var athletesCache = configs.globals.athletes;

function autocomplete(req, res) {
  res.send(athletesCache.allAthletesList);
}

exports.autocomp = autocomplete;