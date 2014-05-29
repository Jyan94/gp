var koa = require('koa');
var app = koa();
var middlewares = require('koa-middlewares');
var flash = require('koa-flash');
var router = require('koa-router');
var passport = require('koa-passport');
var views = require('koa-views');
app.use(middlewares.session({
  secret : 'my secret',
  key : 'sid',
  cookie : {
    secure: true
  }
}));
app.use(flash);
app.use(router);

var user = {
  id: 1, 
  username: 'test' 
}

var LocalStrategy = require('passport-local').Strategy;
passport.use(new LocalStrategy(function(username, password, done) {
  done (null, user); //on success compare user and password
}));

var FacebookStrategy = require('passport-facebook').Strategy;
passport.use(new FacebookStrategy({
  //put in configs
  clientID: '656697897711155',
  clientSecret: 'da59fa7c8e4cc617c40793b45ac31b97',
  callbackURL: app.locals.domain + '/auth/facebook/callback'
},
function(accessToken, refreshToken, profile, done) {

}));

passport.serializeUser(function (user, done) {
  done(null, user.user_id);
});

passport.deserializeUser(function (id, done) {
/*
    var query = 'SELECT * FROM users WHERE user_id=?';
    client.executeAsPrepared(query, [id], cql.types.consistencies.one, function (err, user) {
      done(err, user.rows[0]);
    });
 */
});

app.use(passport.initialize()).use(passport.session());

app.get('/login', function* (next) {
  var errors = this.flash();
  var results = [];
  if (errors.error) {
    for (var i = 0; i < errors.error.length; i++) {
      results.push(JSON.parse(errors.error[i]));
    }
  }
  yield this.render('login.jade', { flash: results });
});

app.post('/login',
  passport.authenticate('local', { successRedirect: '/',
                                   failureRedirect: '/login',
                                   failureFlash: true }));

// Redirect the user to Facebook for authentication.  When complete,
// Facebook will redirect the user back to the application at
//     /auth/facebook/callback
app.get('/auth/facebook',
  passport.authenticate('facebook'));

// Facebook will redirect the user to this URL after approval.  Finish the
// authentication process by attempting to obtain an access token.  If
// access was granted, the user will be logged in.  Otherwise,
// authentication has failed.
app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { successRedirect: '/',
                                      failureRedirect: '/login' }));
