'use strict';
(require('rootpath')());

var express = require('express');
var app = module.exports = express();
var configs = require('config/index');
configs.configure(app);

//mount on on other modules
//keep this file clean
app.use('/', require('routes/index'));
app.get('/', function (req, res) {
  console.log(req.user);
});

//app.listen(3000);
