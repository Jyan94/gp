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
  res.render('login/home');
});

//login
var login = require('routes/registry/login');
app.route('/login')
.get(login.redirectLogin)
.get(login.renderLogin)
.post(passport.authenticate('local', 
  { successRedirect: '/user',
    failureRedirect: '/login',
    failureFlash: true }));

//signup
var signup = require('routes/registry/signup');
app.route('/signup')
.get(login.redirectLogin)
.get(signup.renderSignup)
.post(signup.processSignup);

//logout
var logout = require('routes/registry/logout');
app.get('/logout', logout.logout);

//redirects to login if not logged in
app.all('*', login.checkUser);

//autocomplete
var autocomplete = require('routes/autocomplete');
app.get('/autocomp', autocomplete.autocomp);

//market
var market = require('routes/market');
app.get('/market/:playerId', market.renderPlayerPage);
app.post('/submitForm/:playerId', market.submitBet);
app.post('/addBets/:playerId', market.takeBet);

//profile
var profile = require('routes/profile');
app.get('/user', profile.redirectProfile);
app.get('/user/', profile.redirectProfile);
app.get('/user/:username', profile.retrieveProfile);
app.post('/upload/image/:username', profile.updateProfile);
app.get('/images/:file', profile.pictureNotFound);

//graph
var graph = require('routes/graph');
app.get('/update', graph.update);
app.get('/data', graph.get);

//error handling middleware logs errors and sends 500
var errorHandler = require('routes/error/error');
app.use(errorHandler.errorHandler);

//app.listen(3000);