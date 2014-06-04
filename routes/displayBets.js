require('rootpath')();
var express = require('express');
var app = module.exports = express();
var configs = require('config/index');
configs.configure(app);

var cql = configs.cassandra.cql;
var client = configs.cassandra.client;


var sportsdata_nfl = require('sportsdata').NFL;
var sportsdata_mlb = require('sportsdata').MLB;
var async = require('async');

var request = require('request');
var xml2js = require('xml2js');
var parser = new xml2js.Parser();
var urlHelper = require('../libs/url_helper_mlb');

sportsdata_nfl.init('t', 1, 'gzjpc3dseum9ps25td2y6mtx', 2013, 'REG');
sportsdata_mlb.init('t', 4, 'f8rhpkpxsxdvhzrr3vmxn8wk', 2014, 'REG');

app.use('/', require('../app.js'));

function getbetInfoFromPlayerId(player_id, callback) {
  var rows;
  var betinfo = [];
  var query = 'SELECT bet_id, user_id, long_position, bet_value, multiplier FROM pending_bets WHERE player_id = ?'
  var params = [player_id]
  client.executeAsPrepared(query, params, cql.types.consistencies.one, callback)
}

/* Routing */
app.get('/market/:player_id', function (req, res) {
  var callback = function(err, arr) {
    if (err) {
      console.log(err);
    }
    else {
      return arr;
    }
  }

  async.waterfall(
    [function(callback){
      var rows;
      var betinfo = [];
      var full_name;
      getbetInfoFromPlayerId(req.params.player_id, function(err, result) {
        if (err) {
          console.log(err);
        }
        rows = result.rows;
        for (var i = 0; i < rows.length; i++) {
          betinfo[i] = {
            bet_id: rows[i].bet_id,
            long_position: rows[i].long_position,
            bet_value: rows[i].bet_value,
            multiplier: rows[i].multiplier
          }
        }
      })
      callback(null, betinfo);
    },
    function(betinfo, callback) {
      var query = 'SELECT full_name FROM football_player WHERE player_id = ?'
      var params = [req.params.player_id];
      client.executeAsPrepared(query, params, cql.types.consistencies.one, function(err, result) {
        var player_name = result.rows[0].full_name;
        query = 'SELECT image_url FROM player_images WHERE player_name = ?'
        params = [player_name];
        client.executeAsPrepared(query, params, cql.types.consistencies.one, function(err, result) {
          if (result.rows[0] == undefined) {
            res.render('market', {betinfo: betinfo,
              image_url: 'http://2.bp.blogspot.com/-6QyJDHjB5XE/Uscgo2DVBdI/AAAAAAAACS0/DFSFGLBK_fY/s1600/facebook-default-no-profile-pic.jpg',
              player_id:req.params.player_id})
          }
          else {
            var image_url = result.rows[0].image_url;
            res.render('market', {betinfo: betinfo, image_url: image_url, player_id: req.params.player_id})
          }
        })
      })
    }
  ])
})

app.post('/submitForm/:player_id', function (req, res) {
  var betId = cql.types.timeuuid();
  if (req.body.longOrShort === 'Above') {
    var queries = [
    {
      query: 'INSERT INTO pending_bets (bet_id, user_id, player_id, long_position, bet_value, multiplier) VALUES (?, ?, ?, ?, ?, ?)',
      params: [betId, req.user.user_id, req.params.player_id, true, {value: parseFloat(req.body.price), hint: "double"}, {value: parseFloat(req.body.shareNumber), hint: "double"}]
    },
    {
      query: 'INSERT INTO user_id_to_bet_id (user_id, bet_id) VALUES (?, ?)',
      params: [req.user.user_id, betId]
    }
    ];
    client.executeBatch(queries, cql.types.consistencies.one, function(err) {
      if (err) {
        console.log(err);
      }
      else {
        res.redirect('/market/' + req.params.player_id);
      }
    });
  }
  else if (req.body.longOrShort === 'Under') {
    var queries1 = [
    {
      query: 'INSERT INTO pending_bets (bet_id, user_id, player_id, long_position, bet_value, multiplier) VALUES (?, ?, ?, ?, ?, ?)',
      params: [betId, req.user.user_id, req.params.player_id, false, {value: parseFloat(req.body.price), hint: "double"}, {value: parseFloat(req.body.shareNumber), hint: "double"}]
    },
    {
      query: 'INSERT INTO user_id_to_bet_id (user_id, bet_id) VALUES (?, ?)',
      params: [req.user.user_id, betId]
    }
    ]
    client.executeBatch(queries1, cql.types.consistencies.one, function(err) {
      if (err) {
        console.log(err);
      }
      else{
        res.redirect('/market/' + req.params.player_id);
      }
    });
  }
});


app.post('/addBets/:player_id', function (req, res) {
  var bet_id = req.body.bet_id;
  var query0 = 'SELECT user_id, bet_value, multiplier FROM pending_bets WHERE bet_id = ?'
  var params0 = [bet_id];
  client.executeAsPrepared(query0, params0, cql.types.consistencies.one, function(err, result) {
    if (err) {
      console.log(err);
    }
    else if (result.rows[0] === undefined) {
      console.log('Bet Already Taken')
    }
    else {
      var long_better = result.rows[0].user_id;
      var bet_value = result.rows[0].bet_value;
      var multiplier = result.rows[0].multiplier
      var queries = [
        {
          query: 'DELETE FROM pending_bets WHERE bet_id = ?',
          params: [bet_id]
        },
        {
          query: 'INSERT INTO current_bets (bet_id, long_better_id, short_better_id, player_id, bet_value, multiplier) VALUES (?, ?, ?, ?, ?, ?)',
          params: [bet_id, long_better, req.user.user_id, req.params.player_id, {value: parseFloat(bet_value), hint: "double"}, {value: parseFloat(multiplier), hint: "double"}]
        },
        {
          query: 'INSERT INTO user_id_to_bet_id (user_id, bet_id) VALUES (?, ?)',
          params: [req.user.user_id, bet_id]
        }
      ];
      client.executeBatch(queries, cql.types.consistencies.one, function(err) {
        if (err) {
          console.log(err);
        }
      })
    }
  })
})
app.listen(3000);