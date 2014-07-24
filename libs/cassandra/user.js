'use strict';
require('rootpath')();

var cassandra = require('libs/cassandra/cql');
var configs = require('config/index.js');
var cql = configs.cassandra.cql;
var multiline = require('multiline');
var one = cql.types.consistencies.one;
var quorum = cql.types.consistencies.quorum;
var APPLIED = configs.constants.cassandra.APPLIED;

var INSERT_USER_CQL = multiline(function() {/*
  INSERT INTO users (
    age,
    email,
    facebook_id,
    first_name, 
    image,
    last_name,
    money,
    password,
    payment_info,
    privilege_level,
    user_id,
    username,
    verification_code,
    verified,
    verified_time
  ) VALUES
    (?, ?, ?, ?, ?,
     ?, ?, ?, ?, ?,
     ?, ?, ?, ?, ?)
  IF NOT EXISTS;
*/});

var MONEY_INDEX = 6;
var USER_ID_INDEX = 10;
function insertUser(params, callback) {
  cassandra.queryOneRow(INSERT_USER_CQL, params, one,
    function (err, result) {
      if (err) {
        callback(err);
      }
      else if (result[APPLIED]) {
        callback(null);
      }
      else {
        params[USER_ID_INDEX] = cql.types.uuid();
        insertUser(params, callback);
      }
    });
}

exports.insert = function (params, callback) {
  params[MONEY_INDEX] = {
    value: params[MONEY_INDEX],
    hint: 'double'
  };
  insertUser(params, callback);
};

var DELETE_USER_CQL = multiline(function() {/*
  DELETE FROM users WHERE user_id = ?;
*/});
exports.remove = function (userId, callback) {
  cassandra.query(DELETE_USER_CQL, [userId], one, function(err) {
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

  cassandra.query(
    UPDATE_USER_CQL_1 + ' ' + updates + ' ' + UPDATE_USER_CQL_2,
    params.concat([userId]), 
    one,
    callback);
};

var SELECT_USER_CQL = multiline(function () {/*
  SELECT * FROM users WHERE
*/});

var allowedFields = ['user_id', 'username', 'email'];

function select(field, value, callback) {
  if (allowedFields.indexOf(field) < 0) {
    callback(new Error(field + ' is not a searchable field.'));
  }
  else {
    cassandra.queryOneRow(
      SELECT_USER_CQL + ' ' + field + ' = ?;',
      [value], 
      one,
      callback);
  }
}

function selectById(userId, callback) {
  select('user_id', userId, callback);
}

function selectByUsername(username, callback) {
  select('username', username, callback);
}

function selectByEmail(email, callback) {
  select('email', email, callback);
}
exports.select = select;
exports.selectById = selectById;
exports.selectByUsername = selectByUsername;
exports.selectByEmail = selectByEmail;

var SELECT_USERS_MULTIPLE_CQL = multiline(function () {/*
  SELECT * FROM users WHERE user_id IN
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
  cassandra.query(query, params, one, callback);
}

/* 
 * =============================================================================
 * Update money queries
 * =============================================================================
 */
var UPDATE_MONEY_CQL = multiline(function() {/*
  UPDATE users SET money = ? WHERE user_id = ? IF money = ?;
*/});

/**
 * attempts to update money
 * if update fails, do a read and try again
 * @param  {double}   currentMoney
 * @param  {double}   difference
 * @param  {uuid}   userId
 * @param  {Boolean}  isAdd
 * distinguish between add and subtract
 * @param  {Function} callback
 * args: (err)
 */
function updateMoney(currentMoney, difference, userId, isAdd, callback) {
  var newMoney = -1;
  if (isAdd) {
    newMoney = currentMoney + difference;
  }
  else {
    newMoney = currentMoney - difference;
  }
  if (newMoney < 0) {
    callback(new Error('negative money'));
  }
  else {
    var updateMoneyCallback = function(err, result) {
      if (err) {
        callback(err);
      }
      else if(result[APPLIED]) {
        callback(null);
      }
      else {
        selectById(userId, function(err, result) {
          if (err) {
            callback(err);
          }
          else {
            updateMoney(result.money, difference, userId, isAdd, callback);
          }
        });
      }
    }
    cassandra.queryOneRow(
      UPDATE_MONEY_CQL, 
      [
        {value: newMoney, hint: 'double'}, 
        userId,
        {value: currentMoney, hint: 'double'}
      ],
      quorum,
      updateMoneyCallback);
  }
}

function addMoney(currentMoney, difference, userId, callback) {
  updateMoney(currentMoney, difference, userId, true, callback);
}

function subtractMoney(currentMoney, difference, userId, callback) {
  updateMoney(currentMoney, difference, userId, false, callback);
}

function addMoneyToUser(difference, userId, callback) {
  selectById(userId, function(err, result) {
    if (err) {
      callback(err);
    }
    else {
      updateMoney(result.money, difference, userId, true, callback);
    }
  });
}

function addMoneyToUserUsingUsername(difference, username, callback) {
  selectByUsername(username, function(err, result) {
    if (err) {
      callback(err);
    }
    else {
      updateMoney(result.money, difference, result.user_id, true, callback);
    }
  });
}

function subtractMoneyFromUser(difference, userId, callback) {
  selectById(userId, function(err, result) {
    if (err) {
      callback(err);
    }
    else {
      updateMoney(result.money, difference, userId, false, callback);
    }
  });  
}

exports.addMoney = addMoney;
exports.subtractMoney = subtractMoney;
exports.addMoneyWithoutCurrent = addMoneyToUser;
exports.addMoneyToUserUsingUsername = addMoneyToUserUsingUsername;
exports.subtractMoneyWithoutCurrent = subtractMoneyFromUser;