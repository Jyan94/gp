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
var staticPages = require('routes/static/routes');
app.get('/', staticPages.home);
//commented out for purposes of making public
app.get('/home', staticPages.home);

app.get('/about', staticPages.about);
app.get('/contact', staticPages.contact);
app.get('/faq', staticPages.faq);
app.get('/features', staticPages.features);
app.get('/rules', staticPages.rules);
app.get('/terms', staticPages.terms);

//login
var login = require('routes/registry/login');
app.route('/login')
.get(login.redirectLogin)
.get(login.renderLogin)
.post(passport.authenticate('local',
  { successRedirect: '/user',
    failureRedirect: '/login',
    failureFlash: true }));
// Redirect the user to Facebook for authentication
app.get('/auth/facebook',
  passport.authenticate('facebook'));

// Facebook will redirect the user to this URL after approval.
app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { successRedirect: '/user',
                                      failureRedirect: '/login' }));

//signup
var signup = require('routes/registry/signup');
app.route('/signup')
.get(login.redirectLogin)
.get(signup.renderSignup)
.post(signup.processSignup);

//verify
var verify = require('routes/registry/verify');
app.get('/verify/:email/:ver_code', verify.verify);

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
app.get('/market', market.getDailyScores);

//profile
var profile = require('routes/profile');
app.get('/user', profile.redirectProfile);
app.get('/user/', profile.redirectProfile);
app.get('/user/:username', profile.retrieveProfile);
app.post('/upload/image/:username', profile.updateProfile);
app.get('/images/:file', profile.pictureNotFound);
app.post('/deleteBets/:betId', profile.cancelPendingBet);

//paypal
var paypal = require('routes/paypal');
app.post('/submitPayment/:userId', paypal.submitPayment);

//graph
var graph = require('routes/graph');
app.get('/update', graph.update);
app.get('/data', graph.get);

//tournament
var tournament = require('routes/tournamentTables');
app.get('/tournaments', tournament.renderTournamentTablesPage);
app.get('/tournamentEntry/:contestId', tournament.renderTournamentEntryPage);
app.post('/tournamentEntryProcess/:contestId',
  tournament.tournamentEntryProcess);

//error handling middleware logs errors and sends 500
var errorHandler = require('routes/error/error');
app.use(errorHandler.errorHandler);

//app.listen(3000);