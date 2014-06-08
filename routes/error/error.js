var errorHandler = function (err, req, res, next) {
  console.log(err.stack);
  console.log(err);
  res.send(500, 'Something broke');
}

exports.errorHandler = errorHandler;