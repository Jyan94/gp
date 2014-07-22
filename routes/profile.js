'use strict';
require('rootpath')();

var configs = require('config/index');

var async = require('async');
//var Bet = require('libs/cassandra/bet');
var User = require('libs/cassandra/user');
var cql = configs.cassandra.cql;
var fs = require('fs');
var url = require('url');
var multiline = require('multiline');

var messages = configs.constants.profileStrings;

var userImagePath = __dirname + '/../tmp/';

var redirectProfile = function(req, res, next) {
  User.select('user_id', req.user.user_id,
    function (err, result) {
      if (err) {
        next(err);
      }
      else if (result) {
        res.redirect('/user/' + result.username);
      }
      else {
        res.send(500, 'How did you get here?');
      }
    });
}

var getUser = function(req, res, next, callback) {
  var userInfo = {};
  var field = '';

  User.select('username', req.params.username, function (err, result) {
    if (err) {
      next(err);
    }
    else if (result) {
      for (var i = 0; i < result.columns.length; i++) {
        field = result.columns[i].name;

        if (result[field] === null) {
          userInfo[field] = 'Unavailable';
        }
        else {
          userInfo[field] = result[field];
        }
      }

      callback(null, req, res, next, userInfo);
    }
    else {
      res.send(messages.incorrectUsername);
    }
  });
}

var getBetsFromUser = function(req, res, next, userInfo, callback) {
  /*Bet.selectUsingUserId('all_bets', userInfo.user_id,
    function (err, result) {
      if (err) {
        next(err);
      }
      else {
        SpendingPower.updateSpendingPower(req.user.user_id, req.user.money);
        res.render('profile', { userInfo: userInfo,
                                pendingBetInfo: result.pendingBets,
                                currentBetInfo: result.currentBets,
                                pastBetInfo: result.pastBets
        });
      }
  });*/
 res.render('profile', { userInfo: userInfo,
                                pendingBetInfo: [],
                                currentBetInfo:  [],
                                pastBetInfo: []});
}

var retrieveProfile = function(req, res, next) {
  async.waterfall([
    function (callback) {
      callback(null, req, res, next);
    },
    getUser,
    getBetsFromUser
    ],
    function(err, result) {
      if (err) {
        next(err);
        return;
      }
    });
}

var updateProfile = function(req, res, next) {
  var uploadUsername = req.params.username;
  var uploadFile = null;
  var uploadFilename = null;
  var uploadMimetype = null;
  var uploadUserId = null;

  req.busboy.on('file', function(fieldname, file, filename, encoding,
                                 mimetype) {
    async.waterfall([
      function (callback) {
          // Check that the user posted an appropriate photo
          if (mimetype !== 'image/gif' && mimetype !== 'image/jpeg' &&
              mimetype !== 'image/png') {
          // Again, clobber fraudulent requests
            res.send(500, 'Not a valid file.');
          }
          else {
            uploadFile = file;
            uploadFilename = filename;
            uploadMimetype = mimetype.substring(6);
            callback(null);
          }
        },
      function (callback) {
        User.select('username', uploadUsername, function (err, result) {
          if (err) {
            res.send(500, 'Database error.');
          }
          else if (result) {
            uploadUserId = result.user_id;
            callback(null, result.image);
          }
          else {
            res.send(404, messages.incorrectUsername);
          }
        });
      },
      function (image, callback) {
        if (image && (1===0)) {
          fs.unlink(image, function (err) {
            if (err) {
              res.send(messages.delete_error);
            }

            uploadFile.pipe(fs.createWriteStream(
              userImagePath + uploadUsername + '.' + uploadMimetype)
            );
            callback(null);
          });
        } else {
          uploadFile.pipe(fs.createWriteStream(
            userImagePath + uploadUsername + '.' + uploadMimetype)
          );
          callback(null);
        }
      },
      function (callback) {
        User.update(
          uploadUserId, ['image'],
          ['/images/' + uploadUsername + '.' + uploadMimetype],
          function (err, result) {
            if (err) {
              res.send(500, 'Database error.');
            } else {
              res.send('/images/' + uploadUsername + '.' + uploadMimetype);
              callback(null);
            }
        });
      }
    ], function (err) {
      if (err) {
        next(err);
      }
    });
  });

  req.pipe(req.busboy);
}

var pictureNotFound = function (req, res) {
  var file = req.params.file;
  fs.readFile(userImagePath + file, function (err, result) {
    if (result) {
      res.send(result);
    }
    else {
      res.send(404, 'Profile picture not found.');
    }
  });
}

var cancelCheck = function(req, res, next, callback) {
  var betId = req.params.betId;

  Bet.selectMultiple('pending_bets', [betId], function (err, result) {
    if (err) {
      res.send(500, { error: messages.databaseError });
    }
    else if (result.length === 0) {
      res.send(400, 'Bet does not exist.');
    }
    else if (result.length === 1) {
      if (result[0].user_id !== req.user.user_id) {
        res.send(400, { error: messages.betDeleterError });
      }
      else {
        callback(null, req, res, next, betId, result[0]);
      }
    }
    else {
      res.send(500, 'WTF');
    }
  });
}

var deletePendingBet = function(req, res, next, betId, bet, callback) {
  Bet.delete('pending_bets', betId, function (err, result) {
    if (err) {
      res.send(500, 'Database error.');
    }
    else {
      SpendingPower.updateSpendingPower(req.user.user_id, req.user.money);
      console.log("Deleted!");

      res.send('Deleted pending bet.');
    }
  });
}

var cancelPendingBet = function(req, res, next) {
  async.waterfall([
    function (callback) {
      callback(null, req, res, next);
    },
    cancelCheck,
    deletePendingBet
    ],
    function(err) {
      if (err) {
        next(err);
      }
    });
}

//exports
exports.redirectProfile = redirectProfile;
exports.retrieveProfile = retrieveProfile;
exports.updateProfile = updateProfile;
exports.pictureNotFound = pictureNotFound;
exports.cancelPendingBet = cancelPendingBet;
