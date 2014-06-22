'use strict';
require('rootpath')();

/**
 * checks if user session is still active
 * if it is, redirects to market
 */
var redirectLogin = function(req, res, next) {
  if (req.user) {
    res.redirect('/user');
  } else {
    next();
  }
}

var renderLogin = function(req, res) {
  var results = [];
  res.render('login.jade', { flash: results });
}

//exports.checkUser = checkUser;
exports.redirectLogin = redirectLogin;
exports.renderLogin = renderLogin;