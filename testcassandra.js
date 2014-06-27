var cassandra = require('./libs/cassandra/cql');
var cql = require('./config/index.js').cassandra.cql;
var multiline = require('multiline');
var extend = require('node.extend');
var User = require('libs/cassandra/user');
/*
User.insert([
  '12000000-0000-0000-0000-000000005eb3',
  'test1@test.com',
  true,
  new Date(),
  'hello1',
  'world',
  'first name',
  'last name',
  20,
  'address',
  'paymentinfo',
  0,
  'fbid',
  0,
  'image'
], function(err) {
  if (err) {
    console.log(err);  
  }
})

var query = 'insert into birds (name, bird) VALUES (?, ?)';
var query = 'select * from birds where name = ?'*/

//var query = 'update test42 set bool1 = false where name = ? if bool1 = false and num1 = 1';
/*
cassandra.queryOneRow(
  query, 
  ['hello'],
  cql.types.consistencies.one, 
  function (err, result) {
    if (err) {
      console.log('fuq');
      console.log(err);
    } 
    else {
      console.log(result);
      //console.log(result['[applied]']);
      if (!result) {
        console.log('yoo');
      }
    }
  }
);*/
/*
cassandra.query(
  query, 
  ['david lu', JSON.stringify({want: {name: {david : 'lu'}}, cracker: 'lu'})],
  cql.types.consistencies.one, 
  function (err, result) {
    if (err) {
      console.log('fuq');
      console.log(err);
    } 
    else {
      console.log('world hello');
    }
  }
);*/
/*
cassandra.queryOneRow(
  query, 
  ['david lu'],
  cql.types.consistencies.one, 
  function (err, result) {
    if (err) {
      console.log(cql.types.dataTypes)
      console.log('fuq');
      console.log(err);
    } 
    else {
      console.log(result);
      console.log(result.name);
      console.log(JSON.parse(result.bird).want);
      console.log('world hello');
    }
  }
);
*/

var hello = {
  0: ['hi', 2],
  1: 'hi1',
  2: 'hi2',
  3: 'hi3'
};
/*
(function (callback){
  var a = function(callback) {
    callback('hello world');
  }
  a(function(err) {console.log(err)});
  console.log('a');
  callback();
}(function(err){
  console.log('hello');
}));
*/
/*
var str = JSON.stringify(hello[4]);
console.log(str);
console.log(JSON.parse(str)[0][1]);
*/
/*
var retval = (function() {
  hello = extend(hello, {9 : 'one'});
  var a = function() {
    console.log(hello[0]);
  }
  hello[0] = 2;
  return a;
}());

retval();

var query = 'insert into contest_b (sport, contest_id, athletes) values (?, ?, ?)';

cassandra.query(query, ['soccer', '00000000-0000-0000-0000-000000000000', {value: {1: 'hello'}, hint: 'map'}], cql.types.consistencies.one, function(err) {
  if (err) {
    console.log(err);
  }
})*/

var hello = {
  awayTeam: 'TEST_A',
  awayTeamId: '00000000-0000-0000-0000-000000000000',
  gameDate: (new Date()).getTime(),
  gameId: '00000000-0000-0000-0000-000000000000',
  homeTeam: 'TEST_B',
  homeTeamId: '00000000-0000-0000-0000-000000000001',
}

console.log(JSON.stringify(hello));