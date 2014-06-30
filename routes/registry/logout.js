'use strict';

var logout = function(req, res) {
  req.logout();
  res.redirect('/');
}

exports.logout = logout;