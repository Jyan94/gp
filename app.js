'use strict';
(require('rootpath')());

var express = require('express');
var app = module.exports = express();
var configs = require('config/index');
configs.configure(app);

//mount on on other modules
//keep this file clean
require('libs/backgroundProcesses/backgroundProcesses').start();
var globals = configs.globals.contestA;
var customSetInterval = configs.constants.globals.customSetInterval;
customSetInterval(function(callback) {
  console.log(globals);
  callback(null);
}, 200);
//app.use('/', require('routes/index'));

app.listen(3000);
