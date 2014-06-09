var errorHandler = function (err, req, res, next) {
  console.log(err);
  console.log(err.stack);
  res.send(500, 'Something broke');
}

exports.errorHandler = errorHandler;