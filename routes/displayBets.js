require('rootpath')();
var express = require('express');
var app = module.exports = express();
var configs = require('config/index');
configs.configure(app);

var cql = configs.cassandra.cql;
var client = configs.cassandra.client;

app.use('/', require('../app.js'));

/* Routing */
app.get('/', function (req, res) {
  var rows;
  console.log(req.user);
  var betinfo = [];
  var query = 'SELECT bet_id, user_id, long_position, bet_value, multiplier FROM pending_bets';
  client.executeAsPrepared(query,
    cql.types.consistencies.one,
    function(err, result){
      rows = result.rows;
      for (var i = 0; i < rows.length; i++) {
        betinfo[i] = {
          bet_id: rows[i].bet_id,
          user_id: rows[i].user_id,
          long_position: rows[i].long_position,
          bet_value: rows[i].bet_value,
          multiplier: rows[i].multiplier
        }
      }
      res.render('market', {betinfo : betinfo});
    });
});

app.post('/submitForm', function (req, res) {
  var betId = cql.types.timeuuid();
  if (req.body.longOrShort === 'Above') {
    var queries = [
    {
      query: 'INSERT INTO pending_bets (bet_id, user_id, long_position, bet_value, multiplier) VALUES (?, ?, ?, ?, ?)',
      params: [betId, req.body.namePerson, true, parseInt(req.body.price), parseInt(req.body.shareNumber)]
    },
    {
      query: 'INSERT INTO user_id_to_bet_id (user_id, bet_id) VALUES (?, ?)',
      params: [req.body.namePerson, betId]
    }
    ];
    client.executeBatch(queries, cql.types.consistencies.one, function(err) {
      if (err) {
        console.log(err);
      }
      else {
        res.redirect('/');
      }
    });
  }
  else if (req.body.longOrShort === 'Under') {
    var queries1 = [
    {
      query: 'INSERT INTO pending_bets (bet_id, user_id, ong_position, bet_value, multiplier) VALUES (?, ?, ?, ?, ?)',
      params: [betId, req.body.namePerson, false, parseInt(req.body.price), parseInt(req.body.shareNumber)]
    },
    {
      query: 'INSERT INTO user_id_to_bet_id (user_id, bet_id) VALUES (?, ?)',
      params: [req.body.namePerson, betId]
    }
    ]
    client.executeBatch(queries1, cql.types.consistencies.one, function(err) {
      if (err) {
        console.log(err);
      }
      else{
        res.redirect('/');
      }
    });
  }
});


/*app.post('/addBets', function (req, res) {

  var query0 = 'SELECT user_id, bet_value, multiplier FROM pending_bets WHERE bet_id = ?'
  var params0 = [req.params.bet_id];
  client.executeAsPrepared(query0, params0, cql.types.consistencies.one, function(err, result) {
    if (err) {
      console.log(err);
    }
    else {
      var long_better = result.rows[0].user_id;
      var bet_value = result.rows[0].bet_value;
      var multiplier = result.rows[0].multiplier
      var queries = [
        {
          query: 'DELETE FROM pending_bets WHERE bet_id = ?',
          params: [req.params.bet_id]
        },
        {
          query: 'INSERT INTO current_bets (bet_id, long_better_id, short_better_id, bet_value, multiplier) VALUES (?, ?, ?, ?, ?)',
          params: [req.params.bet_id, long_better, req.user.user_id, bet_value, multiplier]
        },
        {
          query: 'INSERT INTO user_id_to_bet_id (user_id, bet_id) VALUES (?, ?)',
          params: [req.user.user_id, req.params.bet_id]
        }
      ];
      client.executeAsPrepared(queries, cql.types.consistencies.one, function(err) {
        if (err) {
          console.log(err);
        }
      })
    }
  })
})*/
app.listen(3000);