var errorHandler = function (err, req, res, next) {
  console.log(err);
  console.log(err.stack);
  console.trace();
  res.send(400, err);
}

exports.errorHandler = errorHandler;