var errorHandler = function (err, req, res, next) {
  console.log(err);
  console.log(err.stack);
  console.trace();
  req.flash('info', 'Yo wazzup');
  //res.send(500, 'Something broke');
}

exports.errorHandler = errorHandler;