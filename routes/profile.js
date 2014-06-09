'use strict';
require('rootpath')();

var configs = require('config/index');

var async = require('async');
var Bet = require('libs/cassandra/bet');
var User = require('libs/cassandra/user');
var cql = configs.cassandra.cql;
var fs = require('fs');
var url = require('url');
var multiline = require('multiline');

var messages = configs.constants.profileStrings;

var retrieveProfile = function(req, res, next) {
  var userInfo = {};
  var betInfo = [];
  var field = '';

  async.waterfall([
    function (callback) {
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

          callback(null, result.user_id);
        }
        else {
          res.send(messages.incorrect_username);
        }
      });
    },
    function (user_id, callback) {
      Bet.selectUsingUserID('all_bets', user_id, function (err, result) {
        if (err) {
          next(err);
        }
        else {
          betInfo = result;
          callback(null, result);
        }
      });
    }
  ], function(err, result) {
    if (err) {
      next(err);
      return;
    }

    res.render('profile', { userInfo: userInfo, 
                            pendingBetInfo: betInfo.pending_bets,
                            currentBetInfo: betInfo.current_bets,
                            pastBetInfo: betInfo.past_bets
    });
  });
}

var updateProfile = function(req, res, next) {
  var upload_username = req.params.username;
  var upload_file = null;
  var upload_filename = null;
  var upload_mimetype = null;
  var upload_user_id = null;

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
            upload_file = file;
            upload_filename = filename;
            upload_mimetype = mimetype.substring(6);
            callback(null);
          }
        },
      function (callback) {
        User.select('username', upload_username, function (err, result) {
          if (err) {
            res.send(500, 'Database error.');
          }
          else if (result) {
            upload_user_id = result.user_id;
            callback(null, result.image);
          }
          else {
            res.send(404, messages.incorrect_username);
          }
        });
      },
      function (image, callback) {
        if (image && (1===0)) {
          fs.unlink(image, function (err) {
            if (err) {
              res.send(messages.delete_error);
            }

            upload_file.pipe(fs.createWriteStream(
              __dirname + '/../tmp/' + upload_username + '.' + upload_mimetype)
            );
            callback(null);
          });
        } else {
          upload_file.pipe(fs.createWriteStream(
            __dirname + '/../tmp/' + upload_username + '.' + upload_mimetype)
          );
          callback(null);
        }
      },
      function (callback) {
        User.update(
          upload_user_id, ['image'], 
          ['/images/' + upload_username + '.' + upload_mimetype], 
          function (err, result) {
            if (err) {
              res.send(500, 'Database error.');
            } else {
              res.send('/images/' + upload_username + '.' + upload_mimetype);
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
  fs.readFile(__dirname + '/../tmp/' + file, function (err, result) {
    if (result) {
      res.send(result);
    }
    else {
      res.send(404, 'Profile picture not found.');
    }
  });
}

//exports
exports.retrieveProfile = retrieveProfile;
exports.updateProfile = updateProfile;
exports.pictureNotFound = pictureNotFound;