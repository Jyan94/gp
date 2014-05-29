'use strict';
(require('rootpath')());

var express = require('express');
var app = module.exports = express();
var configs = require('config/index');

//mount on on other modules
//app.use('path', require('moduleName'))
//keep this file clean
app.use('/', require('routes/login'));
app.use('/', require('routes/signup'));

app.listen(3000);