//commented out for purposes of making site public before ready

exports.about = function (req, res) {
  if (req.user) {
    res.render('static/about.hbs', {link: 'logout', display: 'Logout'});
  }
  else {
    res.render('static/about.hbs', {link: 'login', display: 'Login/Signup'});
  }
}

exports.contact = function (req, res) {
  if (req.user) {
    res.render('static/contact.hbs', {link: 'logout', display: 'Logout'});
  }
  else {
    res.render('static/contact.hbs', {link: 'login', display: 'Login/Signup'});
  }
}

exports.faq = function (req, res) {
  if (req.user) {
    res.render('static/faq.hbs', {link: 'logout', display: 'Logout'});
  }
  else {
    res.render('static/faq.hbs', {link: 'login', display: 'Login/Signup'});
  }
}

exports.home = function (req, res) {
  if (req.user) {
    res.redirect('/user');
  }
  else {
    res.render('static/home.hbs', {link: 'login', display: 'Login/Signup'});
  }
}

exports.rules = function (req, res) {
  if (req.user) {
    res.render('static/rules.hbs', {link: 'logout', display: 'Logout'});
  }
  else {
    res.render('static/rules.hbs', {link: 'login', display: 'Login/Signup'});
  }
}

exports.terms = function (req, res) {
  if (req.user) {
    res.render('static/terms.hbs', {link: 'logout', display: 'Logout'});
  }
  else {
    res.render('static/terms.hbs', {link: 'login', display: 'Login/Signup'});
  }
}

exports.features = function (req, res) {
  if (req.user) {
    res.render('features/features.hbs', {link: 'logout', display: 'Logout'});
  }
  else {
    res.render(
      'features/features.hbs', 
      {link: 'login', display: 'Login/Signup'});
  }
}
