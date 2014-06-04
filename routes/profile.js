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
                            pendingBetInfo: betInfo.pending_bets,
                            currentBetInfo: betInfo.current_bets,
                            pastBetInfo: betInfo.past_bets
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
  /*req.busboy.on('file', function(fieldname, file, filename, encoding, 
                                     mimetype) {
        // Check that the user posted an appropriate photo
        if (mimetype !== 'image/gif' && mimetype !== 'image/jpeg' &&
            mimetype !== 'image/png') {
        // Again, clobber fraudulent requests
          res.send(500, 'Not a valid image file.');
        }
        else {
          User.select('username', req.params.username, function (err, result) {
            file.pipe(fs.createWriteStream(__dirname + '/' + filename));
            User.update(result.user_id, ['image'], ['http://localhost:3000/images/' + filename], function (err, result) {
              res.send('http://localhost:3000/images/' + filename);
            });
          });
        }
  });
  
  req.pipe(req.busboy);
}*/
  
  var upload_file = null;
  var upload_filename = null;
  var upload_user_id = null;

  req.busboy.on('file', function(fieldname, file, filename, encoding, 
                                     mimetype) {
    async.waterfall([
      function (callback) {
          console.log(2341);
          // Check that the user posted an appropriate photo
          if (mimetype !== 'image/gif' && mimetype !== 'image/jpeg' &&
              mimetype !== 'image/png') {
          // Again, clobber fraudulent requests
            res.send(500, 'Not a valid file.');
          }
          else {
            upload_file = file;
            upload_filename = filename;
            console.log(2341);
            callback(null);
          }
        },
      function (callback) {
        User.select('username', req.params.username, function (err, result) {
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

            upload_file.pipe(fs.createWriteStream(__dirname + '/' + upload_filename));
            callback(null);
          });
        }
        else {
          upload_file.pipe(fs.createWriteStream(__dirname + '/' + upload_filename));
          callback(null);
        }
      },
      function (callback) {
        User.update(upload_user_id, ['image'], ['/images/' + upload_filename], function (err, result) {
          if (err) {
            res.send(500, 'Database error.');
          }
          else {
            res.send('/images/' + upload_filename);
            callback(null);
          }
        });
      }
    ], function (err) {
      if (err) {
        console.log(err);
      }
    });
  });

  req.pipe(req.busboy);
}


app.route('/user')
.get(function (req, res) {
  req.params.username = '';
  retrieveProfile(req, res);
});

app.route('/user/:username').get(retrieveProfile);
app.route('/upload/image/:username').post(updateProfile);


app.route('/images/:file').get(function (req, res) {
  file = req.params.file;
  var img = fs.readFileSync(__dirname + '/' + file);
  if (img) {
    res.send(img);
  }
  else {
    res.send(404, 'Profile picture not found.');
  }
});

app.listen(3000);