var cassandra = require('./libs/cassandra/cql');
var cql = require('./config/index.js').cassandra.cql;
var multiline = require('multiline');

//var query = 'insert into birds (name, bird) VALUES (?, ?)';
//var query = 'select * from birds where name = ?'

var query = 'update test42 set bool1 = false where name = ? if bool1 = false and num1 = 1';
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
      console.log(result['[applied]']);
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