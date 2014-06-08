'use strict';
require('rootpath')();

var checkUser = function(req, res, next) {
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
exports.renderLogin = renderLogin;