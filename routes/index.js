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
//hacked together need elegant
var staticPages = require('routes/static/routes');
var contestA = require('routes/contestA/contestA.js');
app.get('/', function(req, res, next) {
  if (!req.user) {
    staticPages.features(req, res);
  }
  else {
    contestA.renderMarketHome(req, res, next);
  }
});

/*
DEAD LINKS:
app.get('/about', staticPages.about);
app.get('/contact', staticPages.contact);
app.get('/faq', staticPages.faq);
app.get('/features', staticPages.features);
app.get('/rules', staticPages.rules);
app.get('/terms', staticPages.terms);
*/

//login
var login = require('routes/registry/login');
app.route('/login')
  .get(login.redirectLogin)
  .get(login.renderLogin)
  .post(function(req, res, next) {
    login.authenticateCallback(passport, req, res, next);
  });

/*
    passport.authenticate('local',
    { successRedirect: '/marketHome',
      failureRedirect: '/login',
      failureFlash: true }));*/
/*
// Redirect the user to Facebook for authentication
app.get('/auth/facebook',
  passport.authenticate('facebook'));

// Facebook will redirect the user to this URL after approval.
app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { successRedirect: '/user',
                                      failureRedirect: '/login' }));
*/
//signup
var signup = require('routes/registry/signup');
app.route('/signup')
  .get(login.redirectLogin)
  .get(signup.renderSignup)
  .post(signup.processSignup);

//need to do
//verify
//var verify = require('routes/registry/verify');
//app.get('/verify/:email/:verCode', verify.verify);

//redirects to login if not logged in
app.all('*', login.checkUser);

//logout
var logout = require('routes/registry/logout');
app.get('/logout', logout.logout);
//market

//app.get('/market/:athleteId', market.renderAthletePage);
//app.post('/submitForm/:athleteId', market.submitBet);
//app.post('/addBets/:athleteId', market.takeBet);
//app.get('/markethome', market.getDailyScores);

//profile
var profile = require('routes/profile');
app.get('/user', profile.redirectProfile);
app.get('/user/', profile.redirectProfile);
app.get('/user/:username', profile.retrieveProfile);
app.post('/upload/image/:username', profile.updateProfile);
app.get('/images/:file', profile.pictureNotFound);
//app.post('/deleteBets/:betId', profile.cancelPendingBet);

//paypal
var paypal = require('routes/paypal');
app.post('/submitPayment/:userId', paypal.submitPayment);

//contest A

app.get('/initialAthletesLoad', contestA.getAllAthletes);
app.get('/getTodaysGames', contestA.getTodaysGames);
app.get('/market', contestA.getMarket);
app.get('/getbets', contestA.getMarketBets);
app.get('/marketHome', contestA.renderMarketHome);
/*app.get('/marketHomeDailyBoxscores', contestA.sendMarketHomeDailyBoxscores);
app.get('/marketHomeTopPlayers', contestA.sendMarketHomeTopPlayers);*/
app.get('/getMarketBets', contestA.getMarketBets);
app.get('/getAthleteTimeseries', contestA.getTimeseries);
app.get('/takePendingBet', contestA.takePendingBet);
app.post('/placePendingBet', contestA.placePendingBet);


//contest A portfolio
var contestAPortfolio = require('routes/portfolioContestA/portfolio');
app.get('/portfolio', contestAPortfolio.renderPortfolio);
app.get('/initPortfolio', contestAPortfolio.sendOverInitData);
app.get('/getMultiAthleteTimeseries', contestAPortfolio.getMultiTimeseries);

//contest b
//commented out for now since not demoing it
/*
var contestB = require('routes/contestB/contestB');
app.get('/contestB', contestB.renderContestPage);
app.get('/populateContestBTable', contestB.sendContestTable);
app.get('/contestBInfo', contestB.renderContestInfoPage);
app.get('/contestBCreation', contestB.renderContestCreationPage);
app.post('/contestBCreationProcess', contestB.contestCreationProcess);
app.get('/contestBEntry/:contestId', contestB.renderContestEntryPage);
app.post('/contestBEntryProcess/:contestId',
  contestB.contestEntryProcess);
app.get('/contestBEdit/:contestId/:contestantInstanceIndex',
  contestB.renderContestEditPage);
app.post('/contestBEditProcess/:contestId/:contestantInstanceIndex',
  contestB.contestEditProcess);
*/

//error handling middleware logs errors and sends 500
var errorHandler = require('routes/error/error');
app.use(errorHandler.errorHandler);

//app.listen(3000);