'use strict';
require('rootpath')();

var cassandra = require('libs/cassandra/cql');
var cql = require('config/index.js').cassandra.cql;
var multiline = require('multiline');

var INSERT_USER_CQL = multiline(function() {/*
  INSERT INTO users (
    userId, email, verified, verifiedTime, username, password, firstName,
    lastName, age, address, paymentInfo, money, fbid, vipStatus, image
  ) VALUES 
    (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
*/});
exports.insert = function (params, callback) {
  //parse values
  cassandra.query(INSERT_USER_CQL, params, cql.types.consistencies.one,
    function (err) {
      callback(err);
    });
};

var DELETE_USER_CQL = multiline(function() {/*
  DELETE FROM users WHERE userId = ?;
*/});
exports.delete = function (userId, callback) {
  cassandra.query(DELETE_USER_CQL, [userId], cql.types.consistencies.one,
    function (err) {
      callback(err);
    });
};

var UPDATE_USER_CQL_1 = multiline(function() {/*
  UPDATE users SET
*/});
var UPDATE_USER_CQL_2 = multiline(function() {/*
  WHERE
    userId = ?;
*/});
exports.update = function (userId, fields, params, callback) {
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
    params.concat([userId]), cql.types.consistencies.one,
    function (err) {
      callback(err);
    });
};

var UPDATE_MONEY_CQL = multiline(function() {/*
  UPDATE users SET money = ? WHERE userId = ?;
*/});
exports.updateMoney = function (moneyValues, userIdValues, callback) {
  var moneyValuesLength = moneyValues.length;
  var userIdValuesLength = userIdValues.length;
  var oldMoneyValues = {};
  var currentUserId = null;
  var query = [];

  if (moneyValuesLength !== userIdValuesLength) {
    callback(new Error('Number of money values and user id values are not the same.'));
  }

  exports.selectMultiple(userIdValues, function (err, result) {

    for (var i = 0; i < result.length; i++) {
      currentUserId = result[i].userId;
      oldMoneyValues[currentUserId] = result[i].money;
    }

    for (i = 0; i < moneyValuesLength; i++) {
      currentUserId = userIdValues[i];
      query[i] = {
        query: UPDATE_MONEY_CQL,
        params: [oldMoneyValues[currentUserId] + moneyValues[i], currentUserId]
      }
    }

    cassandra.queryBatch(query, cql.types.consistencies.one, 
      function(err, result) {
        callback(err, result);
    });
  })
};


var SELECT_USER_CQL = multiline(function () {/*
  SELECT * FROM users WHERE
*/});

var allowedFields = ['userId', 'username', 'email'];

exports.select = function (field, value, callback) {
  if (allowedFields.indexOf(field) < 0) {
    callback(new Error(field + ' is not a searchable field.'));
  } else {
    cassandra.queryOneRow(SELECT_USER_CQL + ' ' + field + ' = ?;',
      [value], cql.types.consistencies.one, 
      function(err, result) {
        callback(err, result);
    });
  }
};


var SELECT_USERS_MULTIPLE_CQL = multiline(function () {/*
  SELECT * FROM users WHERE userId IN
*/});
exports.selectMultiple = function selectMultiple(params, callback) {
  var paramsLength = params.length;
  var filter = '';
  var query = '';

  for (var i = 0; i < paramsLength; i++) {
    filter += '?';

    if (i < (paramsLength - 1)) {
      filter += ', ';
    }
  }

  query = SELECT_USERS_MULTIPLE_CQL + ' (' + filter + ');';
  cassandra.query(query, params, cql.types.consistencies.one,
    function (err, result) {
      console.log(result);
      callback(err, result);
    });
}