require('rootpath')();
var configs = require('config/index');

var cql = configs.cassandra.cql;
var client = configs.cassandra.client;

var async = require('async');

var Bet = require('libs/cassandra/bet');
var Player = require('libs/cassandra/player')
var Cql = require('libs/cassandra/cql')

function getbetInfoFromPlayerId(player_id, callback) {
  Bet.selectUsingPlayerID('pending_bets', player_id, function (err, result) {
    if (err) {
      console.log(err);
    }
    else{
      callback(null, result);
    }
  });
}


var get = function (req, res) {
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
        rows = result;
        for (var i = 0; i < rows.length; i++) {
          betinfo[i] = {
            bet_id: rows[i].bet_id,
            long_position: rows[i].long_position,
            bet_value: rows[i].bet_value,
            multiplier: rows[i].multiplier
          }
        }
        callback(null, betinfo);
      });
    },
    function(betinfo, callback) {
      var default_image = 'http://2.bp.blogspot.com/-6QyJDHjB5XE/Uscgo2DVBdI/AAAAAAAACS0/DFSFGLBK_fY/s1600/facebook-default-no-profile-pic.jpg';
      Player.select('player_id', req.params.player_id, function(err, result) {
        if (err) {
          console.log(err);
        }
        var player_name = result.full_name;
        Player.selectImagesUsingPlayersName(player_name, function(err, result) {
          if (result == undefined) {
            res.render('market', {betinfo: betinfo,
              image_url: default_image,
              player_id:req.params.player_id})
          }
          else {
            var image_url = result.image_url;
            res.render('market', {betinfo: betinfo,
              image_url: image_url,
              player_id: req.params.player_id})
          }
        });
      });
    }],
    callback
  );
}

var insertToPendingTable = function(betId, user, player, long_pos, price, multiplier, callback) {
    var queries = [
  {
    query: 'INSERT INTO pending_bets (bet_id, user_id, player_id, long_position, bet_value, multiplier) VALUES (?, ?, ?, ?, ?, ?)',
    params: [betId, user, player, long_pos, {value: parseFloat(price), hint: "double"}, {value: parseFloat(multiplier), hint: "double"}]
  },
  {
    query: 'INSERT INTO user_id_to_bet_id (user_id, bet_id) VALUES (?, ?)',
    params: [user, betId]
  }
  ];
  Cql.executeBatch(queries, cql.types.consistencies.one, callback)
}
//post to '/submitForm/:player_id'
var submitBet = function (req, res) {
  var betId = cql.types.timeuuid();
  var long_pos;
  if (req.body.longOrShort === 'Above') {
    long_pos = true;
  }
  else {
    long_pos = false;
  }
  insertToPendingTable(betId,
    req.user.user_id,
    req.params.player_id,
    long_pos,
    req.body.price,
    req.body.shareNumber,
    function(err){
    if (err) {
      console.log(err);
    }
    else {
      res.redirect('/market/' + req.params.player_id)
    }
  })
}

var insertIntoCurrentTable = function(bet_id, long_pos, taker, giver, player_id, bet_value, multiplier, callback) {
  var short_better;
  var long_better;
  if (long_pos === true) {
    short_better = taker;
    long_better = giver;
  }
  else {
    short_better = giver;
    long_better = taker;
  }

  var queries = [
    {
      query: 'DELETE FROM pending_bets WHERE bet_id = ?',
      params: [bet_id]
    },
    {
      query: 'INSERT INTO current_bets (bet_id, long_better_id, short_better_id, player_id, bet_value, multiplier) VALUES (?, ?, ?, ?, ?, ?)',
      params: [bet_id, long_better, short_better, player_id, {value: parseFloat(bet_value), hint: "double"}, {value: parseFloat(multiplier), hint: "double"}]
    },
    {
      query: 'INSERT INTO user_id_to_bet_id (user_id, bet_id) VALUES (?, ?)',
      params: [taker, bet_id]
    }
  ];
  Cql.executeBatch(queries, cql.types.consistencies.one, function(err) {
    if (err) {
      console.log(err);
    }
  })
}

//post to '/addBets/:player_id'
var takeBet = function (req, res) {
  var bet_id = req.body.bet_id;
  Bet.selectMultiple('pending_bets', [bet_id], function(err, result) {
    if (err) {
      console.log(err);
    }
    else if (result.rows[0] === undefined) {
      console.log('Bet Already Taken')
    }
    else {
      var long_pos = result.rows[0].long_position
      var giver = result.rows[0].user_id;
      var taker = req.user.user_id
      var bet_value = result.rows[0].bet_value;
      var multiplier = result.rows[0].multiplier
      insertIntoCurrentTable(bet_id, long_pos, taker, giver,  req.params.player_id, bet_value, multiplier, function(err) {
        if (err) {
          console.log(err);
        }
      })
    }
  });
}

//exports above functions
exports.get = get;
exports.submitBet = submitBet;
exports.takeBet = takeBet;