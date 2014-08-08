/**
 * ====================================================================
 * Author: Harrison Zhao
 * ====================================================================
 */
'use strict';
require('rootpath')();


/**
 * checks if user session is still active
 * if it is, redirects to market
 */
var checkUser = function(req, res, next) {
  if (!req.user) {
    res.redirect('/login');
  } else {
    next();
  }
}

/**
 * checks if user session is still active
 * if it is, redirects to market
 */
var redirectLogin = function(req, res, next) {
  if (req.user) {
    res.redirect('/marketHome');
  } else {
    next();
  }
}

var renderLogin = function(req, res) {
  res.render('registry/login.html');
}

var authenticateCallback = function(passport, req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) { 
      return next(err); 
    }
    else if (info) {
      return res.send(info);
    }
    req.logIn(user, function(err) {
      if (err) { 
        return next(err); 
      }
      return res.send({});
    });
  })(req, res, next);
}

exports.checkUser = checkUser;
exports.redirectLogin = redirectLogin;
exports.renderLogin = renderLogin;
exports.authenticateCallback = authenticateCallback;