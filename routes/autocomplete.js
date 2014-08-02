'use strict';
(require('rootpath')());
var configs = require('config/index');
var athletesCache = configs.globals.athletes;

function autocomplete(req, res) {
  res.send(JSON.stringify(athletesCache.allAthletesList));
}

exports.autocomplete = autocomplete;