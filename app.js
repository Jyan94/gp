'use strict';
(require('rootpath')());

var express = require('express');
var app = module.exports = express();
var configs = require('config/index');
configs.configure(app);

var calculate = require('routes/calculateMlbEarnings.js');

//mount on on other modules
//keep this file clean
app.use('/', require('routes/index'));

//setInterval(calculate.checkCurrentBets, 600000);

app.listen(3000);
