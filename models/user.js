require('rootpath')();
//var cql = require('libs/database/cassandra/cassandraClient.js').cql;

var cassandra = require('./cql');
var cql = cassandra.cql;
var passport = require('koa-passport');
var multiline = require('multiline');

var INSERT_USER_CQL = multiline(function() {;/*
  INSERT INTO users (
    user_id, email, verified, verified_time, username, password, first_name,
    last_name, age, address, payment_info, money, fbid, VIP_status
  ) VALUES 
    (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
*/});
exports.insert = function (fields, callback) {
  //parse values
  cassandra.query(INSERT_USER_CQL, fields, cql.types.consistencies.one,
    function (err) {
      callback(err);
    });
};

var DELETE_USER_CQL = multiline(function() {;/*
  DELETE FROM users WHERE
    user_id
  IN
    (?);
*/});
exports.delete = function (user_id, callback) {
  cassandra.query(DELETE_USER_CQL, [user_id], cql.types.consistencies.one,
    function (err) {
      callback(err);
    });
};

var UPDATE_USER_CQL_1 = multiline(function() {;/*
  UPDATE users SET
*/});
var UPDATE_USER_CQL_2 = multiline(function() {;/*
  WHERE
    user_id = ?;
*/});
exports.update = function (user_id, fields, params, callback) {
  var fieldsLength = fields.length;
  var paramsLength = params.length;
  var updates = '';

  if (fields.length !== params.length) {
    console.log('Number of fields and parameters are not the same.');
  }

  for (var i = 0; i < fieldsLength; i++) {
    updates += (fields[i] + ' = ?');

    if (i < (fieldsLength - 1)) {
      updates += ', ';
    }
  }

  cassandra.query(UPDATE_USER_CQL_1 + ' ' + updates + ' ' + UPDATE_USER_CQL_2,
    params.concat([user_id]), cql.types.consistencies.one,
    function (err) {
      callback(err);
    });
};

var INDEX_USERS_CQL = multiline(function () {;/*
  CREATE INDEX IF NOT EXISTS ON users
*/});

var SELECT_USER_CQL = multiline(function () {;/*
  SELECT * FROM users WHERE
*/});

//if not searching by user_id
function chainSelectQuery(field, value, callback) {
  cassandra.query(
    INDEX_USERS_CQL + ' (' + field + ');', 
    [],
    cql.types.consistencies.one, 
    function(err, result) {
      cassandra.queryOneRow(
        SELECT_USER_CQL + ' ' + field + ' = ?;',
        [value], 
        cql.types.consistencies.one, 
        function(err, result) {
          callback(err, result);
        });
    });
}

exports.select = function (field, value, callback) {
  if (field !== 'user_id') {
    chainSelectQuery(field, value, callback);
  } else {
    cassandra.queryOneRow(
      SELECT_USER_CQL + ' ' + field + ' = ?;',
      [value], 
      cql.types.consistencies.one, 
      function(err, result) {
        callback(err, result);
    });
  }
};