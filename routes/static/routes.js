exports.about = function (req, res) {
  if (req.user) {
    res.render('static/about.ejs', {link: 'logout', display: 'Logout'});
  }
  else {
    res.render('static/about.ejs', {link: 'login', display: 'Login'});
  }
}

exports.contact = function (req, res) {
  if (req.user) {
    res.render('static/contact.ejs', {link: 'logout', display: 'Logout'});
  }
  else {
    res.render('static/contact.ejs', {link: 'login', display: 'Login'});
  }
}

exports.faq = function (req, res) {
  if (req.user) {
    res.render('static/faq.ejs', {link: 'logout', display: 'Logout'});
  }
  else {
    res.render('static/faq.ejs', {link: 'login', display: 'Login'});
  }
}

exports.features = function (req, res) {
  if (req.user) {
    res.render('static/features.ejs', {link: 'logout', display: 'Logout'});
  }
  else {
    res.render('static/features.ejs', {link: 'login', display: 'Login'});
  }
}

exports.home = function (req, res) {
  if (req.user) {
    res.render('static/home.ejs', {link: 'logout', display: 'Logout'});
  }
  else {
    res.render('static/home.ejs', {link: 'login', display: 'Login'});
  }
}

exports.rules = function (req, res) {
  if (req.user) {
    res.render('static/rules.ejs', {link: 'logout', display: 'Logout'});
  }
  else {
    res.render('static/rules.ejs', {link: 'login', display: 'Login'});
  }
}

exports.terms = function (req, res) {
  if (req.user) {
    res.render('static/terms.ejs', {link: 'logout', display: 'Logout'});
  }
  else {
    res.render('static/terms.ejs', {link: 'login', display: 'Login'});
  }
}