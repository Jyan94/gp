exports.about = function (req, res) {
  if (req.user) {
    res.render('logout/about.html');
  }
  else {
    res.render('login/about.html');
  }
}

exports.contact = function (req, res) {
  if (req.user) {
    res.render('logout/contact.html');
  }
  else {
    res.render('login/contact.html');
  }
}

exports.faq = function (req, res) {
  if (req.user) {
    res.render('logout/faq.html');
  }
  else {
    res.render('login/faq.html');
  }
}

exports.features = function (req, res) {
  if (req.user) {
    res.render('logout/features.html');
  }
  else {
    res.render('login/features.html');
  }
}

exports.home = function (req, res) {
  if (req.user) {
    res.render('logout/home.html');
  }
  else {
    res.render('login/home.html');
  }
}

exports.rules = function (req, res) {
  if (req.user) {
    res.render('logout/rules.html');
  }
  else {
    res.render('login/rules.html');
  }
}

exports.terms = function (req, res) {
  if (req.user) {
    res.render('logout/terms.html');
  }
  else {
    res.render('login/terms.html');
  }
}