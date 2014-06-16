'use strict';
var client = require('./cassandraClient.js');

module.exports = function(cl) {
  return {
    hello : function() {
      if (cl === client) {
        console.log('hello world');
      }
    }
  };
}