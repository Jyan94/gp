'use strict';
(require('rootpath')());

var express = require('express');
var app = module.exports = express();
var configs = require('config/index');
configs.configure(app);

//mount on on other modules
//keep this file clean
require('libs/backgroundProcesses/updateCaches').start();
/*var customSetInterval = configs.constants.globals.customSetInterval;
var globals = configs.globals.contestA;
customSetInterval(function(callback) {
  console.log(globals.timeseries);
  callback(null);
}, 2000);*/

app.use('/', require('routes/index'));

app.listen(3000);