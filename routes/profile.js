require('rootpath')();
var express = require('express');
var app = module.exports = express();
var configs = require('config/index');
configs.configure(app);

//app.use('/', require('../app.js'))

var async = require('async');
var User = require('libs/cassandra/user');
var bet = require('libs/cassandra/bet');
var cql = configs.cassandra.cql;
var busboy = require('connect-busboy');
var fs = require('fs');
var url = require('url');

app.use(busboy());

var messages = {
  incorrect_username: '{ "title": "Incorrect username", "parts": ["We couldn\'t find any user with the username you provided.", "Please try again with a different username."] }',
  delete_error: '{ "title": "Delete error", "parts": ["Something went wrong while deleting a file."] }',
  upload_error:'{ "title": "Upload error", "parts": ["Something went wrong while uploading a file."] }'
  };

function retrieveProfile(req, res) {
  var userInfo = {};
  var betInfo = [];
  var field = '';

  async.waterfall([
    function (callback) {
      User.select('username', req.params.username, function (err, result) {
        if (err) {
          console.log(err);
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

          console.log(userInfo)

          callback(null, result.user_id);
        }
        else {
          res.send(messages.incorrect_username);
        }
      });
    },
    function (user_id, callback) {
      bet.selectUsingUserID('all_bets', user_id, function (err, result) {
        if (err) {
          console.log(err);
        }
        else {
          betInfo = result;
          callback(null, result);
        }
      });
    }
  ], function(err, result) {
    if (err) {
      console.log(err);
      return;
    }

    res.render('profile', { userInfo: userInfo, 
                            betInfo: betInfo
    });
  });
}

/*
  Git commands if you forget:
  git add -A
  git commit -m
  git push
 */

function updateProfile(req, res) {
  var upload_file = null;
  var upload_filename = null;
  var upload_user_id = null;

  async.waterfall ([
    function (callback) {
      req.pipe(req.busboy);
      req.busboy.on('file', function(fieldname, file, filename, encoding, 
                                     mimetype) {
        // Check that the user posted an appropriate photo
        if (mimetype !== 'image/gif' && mimetype !== 'image/jpeg' &&
            mimetype !== 'image/png') {
        // Again, clobber fraudulent requests
          res.end();
        }
        else {
          upload_file = file;
          upload_filename = filename;
          callback(null);
        }
      });
    },
    function (callback) {
      User.select('username', req.params.username, function (err, result) {
        if (err) {
          console.log(err);
        }
        else if (result) {
          upload_user_id = result.user_id;
          callback(null, result.image);
        }
        else {
          res.send(messages.incorrect_username);
        }
      });
    },
    function (image, callback) {
      if (image && (1===0)) {
        fs.unlink(image, function (err) {
          if (err) {
            res.send(messages.delete_error);
          }
          
            image = 'file://' + __dirname + '/' + upload_filename;
            callback(null, image);
        });
      }
      else {
        image = 'file://' + __dirname + '/' + upload_filename;
        console.log(image);
        callback(null, image);
      }
    },
    function (image, callback) {
      //upload_file.pipe(fs.createWriteStream(image));
      callback(null, image);
    },
    function (image, callback) {
      console.log(image);
      User.update(upload_user_id, ['image'], [image], function (err, result) {
        if (err) {
          res.send(messages.update_error);
        }
        else {
          callback(null, result);
        }
      });
    }
  ], function (err, result) {
    if (err) {
      console.log(err);
    }
    else {
      return { image: upload_filename };
    }
  });
}

app.route('/user')
.get(function (req, res) {
  req.params.username = '';
  retrieveProfile(req, res);
});

app.route('/user/:username').get(retrieveProfile);
app.route('/upload/image/:username').post(updateProfile);

app.listen(3000);