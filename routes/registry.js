require('rootpath')();
var express = require('express');
var app = module.exports = express();
var configs = require('config/index');
configs.configure(app);

var User = require('models/user');
var cql = configs.cassandra.cql;

var ERROR = {
  'message': 'incorrect username'
};

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

function localStrategyVerify(username, password, done) {
  User.select('username', username, function (err, result) {
    if (err) {
      return done(err);
    }
    if (!result) {
      return done(null, false, ERROR);
    }
    //do bcrypt compare here
    return done(null, result);
  });
}

passport.use(new LocalStrategy({
  usernameField: 'user',
  passwordField: 'world'
},
function(username, password, done) {
  localStrategyVerify(username, password, done);
}));

passport.serializeUser(function (user, done) {
  done(null, user.user_id);
});

passport.deserializeUser(function (id, done) {
  User.select('user_id', id, function(err, result){
    done(err, result);
  });
});

app.use(passport.initialize());
app.use(passport.session());
/*app.get('/', function(req, res) {
  res.render('index');
});*/

app.get('/', function(req, res) {
  var errors = req.flash();
  console.log(errors);
  var results = [];
  if (errors.error) {
    for (var i = 0; i < errors.error.length; i++) {
      results.push(JSON.parse(errors.error[i]));
    } 
  }
  res.render('login', { flash: results });
});

app.get('/index', function(req, res) {
  res.render('index');
});

app.route('/signup')
.get(function(req, res) {
  res.render('signup');
})
.post(function(req, res) {

});

app.post('/',
  passport.authenticate('local', { successRedirect: '/',
                                   failureRedirect: '/',
                                   failureFlash: true }));

app.listen(3000);