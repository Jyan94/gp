'use strict';
(require('rootpath')());

var cassClient = require('libs/database/cassandra/cassandraClient.js').client;
var koa = require('koa'); 
var app = koa();

//module.exports = app;
function main() { 
  app.listen(3000);
  console.log('now listening on port 3000');
}

cassClient.connectAsync().then(function() {
  main();
}).catch(function (e) {
  console.log('Exception: ' + e);
}).error(function (e) {
  console.log('Error: ' + e);
})