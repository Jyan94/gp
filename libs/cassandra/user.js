'use strict';
require('rootpath')();

var cassandra = require('libs/cassandra/cql');
var cql = require('config/index.js').cassandra.cql;
var multiline = require('multiline');

var INSERT_USER_CQL = multiline(function() {/*
  INSERT INTO users (
    user_id, email, verified, verified_time, username, password, first_name,
    last_name, age, address, payment_info, money, fbid, vip_status, image
  ) VALUES 
    (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
*/});
exports.insert = function (fields, callback) {
  //parse values
  cassandra.query(INSERT_USER_CQL, fields, cql.types.consistencies.one,
    function (err) {
      callback(err);
    });
};

var DELETE_USER_CQL = multiline(function() {/*
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

var UPDATE_USER_CQL_1 = multiline(function() {/*
  UPDATE users SET
*/});
var UPDATE_USER_CQL_2 = multiline(function() {/*
  WHERE
    user_id = ?;
*/});
exports.update = function (user_id, fields, params, callback) {
  var fieldsLength = fields.length;
  var paramsLength = params.length;
  var updates = '';

  if (fields.length !== params.length) {
    callback(new Error('Number of fields and parameters are not the same.'));
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

var SELECT_USER_CQL = multiline(function () {/*
  SELECT * FROM users WHERE
*/});

var allowed_fields = ['user_id', 'username', 'email'];

exports.select = function (field, value, callback) {
  if (allowed_fields.indexOf(field) < 0) {
    callback(new Error(field + ' is not a searchable field.'));
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