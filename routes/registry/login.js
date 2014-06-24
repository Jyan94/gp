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
  var errors = req.flash().error;
  var errorsSend = [];

  if (typeof(errors) !== 'undefined') {
    for (var i = 0; i < errors.length; i++) {
      errorsSend[i] = JSON.parse(errors[i]);
    }
  }

  console.log(errorsSend);

  res.render('login.jade', { errors: errorsSend });
}

//exports.checkUser = checkUser;
exports.redirectLogin = redirectLogin;
exports.renderLogin = renderLogin;