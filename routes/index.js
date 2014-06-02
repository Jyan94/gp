//file used to load other routes
'use strict';
(require('rootpath')());

var express = require('express');
var app = module.exports = express();
var configs = require('config/index');
configs.configure(app);

//login contains passport authentication
app.use('/', require('routes/registry/login'));
app.use('/', require('routes/registry/signup'));