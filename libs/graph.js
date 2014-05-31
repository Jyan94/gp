require('rootpath')();
var express = require('express');
var app = module.exports = express();
var configs = require('config/index');
configs.configure(app);

app.get('/', function(req, res){
  res.render('graph');
});

app.listen(3000);