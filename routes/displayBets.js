require('rootpath')();
var express = require('express');
var app = module.exports = express();
var configs = require('config/index');
configs.configure(app);

var cql = configs.cassandra.cql;
var client = configs.cassandra.client;

/* Routing */
app.get('/', function (req, res) {
  var rows;
  var betinfo = [];
  var query = 'SELECT bet_id, bet_value, multiplier, long_better_id, short_better_id FROM pending_bets';
  client.executeAsPrepared(query,
    cql.types.consistencies.one,
    function(err, result){
      rows = result.rows;
      for (var i = 0; i < rows.length; i++) {
        betinfo[i] = {
          bet_id: rows[i].bet_id,
          bet_value: rows[i].bet_value,
          multiplier: rows[i].multiplier,
          long_better_id: rows[i].long_better_id,
          short_better_id: rows[i].short_better_id
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
      query: 'INSERT INTO pending_bets (bet_id, long_better_id, bet_value, multiplier) VALUES (?, ?, ?, ?)',
      params: [betId, req.body.namePerson, parseInt(req.body.price), parseInt(req.body.shareNumber)]
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
      query: 'INSERT INTO pending_bets (bet_id, short_better_id, bet_value, multiplier) VALUES (?, ?, ?, ?)',
      params: [betId, req.body.namePerson, parseInt(req.body.price), parseInt(req.body.shareNumber)]
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


/*app.post('/', function (req, res) {
  var queries = [
  {
    query: 'DELETE FROM pending_bets WHERE bet_id = ?',
    params: [betid???]

    query: 'INSERT INTO current_bets (bet_id,
    query: 'INSERT INTO user_id_to_bet_id'
  }
  ]
})*/
app.listen(3000);