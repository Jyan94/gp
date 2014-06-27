'use strict';
(require('rootpath')());

var express = require('express');
var app = module.exports = express();
var configs = require('config/index');
configs.configure(app);

var tournamenttables = function (req, res) {
  if (req.user) {
    res.render('tournamenttables.hbs');
  }
  else {
    res.render('tournamenttables.hbs');
  }
}

app.get('/tournamenttables', tournamenttables);
app.listen(3000);