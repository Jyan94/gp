'use strict';
require('rootpath')();

/**
 * redirects to login if not logged in
 */
var checkUser = function (req, res, next) {
  if (req.user) {
    next();
  } else {
    res.redirect('/login');
  }
}

/**
 * checks if user session is still active
 * if it is, redirects to market
 */
var redirectLogin = function(req, res, next) {
  if (req.user) {
    res.redirect('/market');
  } else {
    next();
  }
}

var renderLogin = function(req, res) {
  var results = [];
  res.render('login.jade', { flash: results });
}

exports.checkUser = checkUser;
exports.redirectLogin = redirectLogin;
exports.renderLogin = renderLogin;