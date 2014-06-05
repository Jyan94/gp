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
  res.redirect('/market/00000000-0000-0000-0000-000000005ba7');
});

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
var market = require('routes/displayBets');
app.get('/market/:player_id', market.get);
app.post('/submitForm/:player_id', market.submitBet);
app.post('/addBets/:player_id', market.takeBet);

//profile
var profile = require('routes/profile');
app.route('/user')
.get(function (req, res) {
  req.params.username = '';
  profile.retrieveProfile(req, res);
});
app.route('/user/:username').get(profile.retrieveProfile);
app.route('/upload/image/:username').post(profile.updateProfile);
app.route('/images/:file').get(profile.pictureNotFound);

//app.listen(3000);