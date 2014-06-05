//file used to load other routes
'use strict';
(require('rootpath')());

var express = require('express');
var app = module.exports = express();
var configs = require('config/index');
configs.configure(app);

//authentication
require('routes/registry/authenticate');
var passport = require('passport');
app.use(passport.initialize());
app.use(passport.session());


//root path
//FOR TESTING PURPOSES
app.get('/', function(req, res) {
  res.render('banner');
});


//autocomplete
var autocomplete = require('routes/autocomplete');
app.get('/autocomp', autocomplete.autocomp);

//login
app.route('/login')
.get(function(req, res, next) {
  if (req.user) {
    res.redirect('/market');
  } else {
    next();
  }
})
.get(function(req, res) {
  var results = [];
  res.render('login.jade', { flash: results });
})
.post(passport.authenticate('local', 
  { successRedirect: '/market',
    failureRedirect: '/login',
    failureFlash: true }));

//signup
var signup = require('routes/registry/signup');
app.route('/signup')
.get(function(req, res, next) {
  if (req.user) {
    res.redirect('/market');
  } else {
    next();
  }
})
.get(function(req, res) {
  res.render('signup');
})
.post(function(req, res) {
  signup.processSignUp(req, res);
});

//market
var market = require('routes/market');
app.get('/market/:player_id', market.get);
app.post('/submitForm/:player_id', market.submitBet);
app.post('/addBets/:player_id', market.takeBet);

//profile
var profile = require('routes/profile');
app.get('/user/:username', profile.retrieveProfile);
app.post('/upload/image/:username', profile.updateProfile);
app.get('/images/:file', profile.pictureNotFound);

//app.listen(3000);