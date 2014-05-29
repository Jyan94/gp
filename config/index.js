'use strict';
var bodyParser = require('body-parser');
var cookieparser = require('cookie-parser');
var compress = require('compression');
var express = require('express');
//var CassandraStore = require('connect-cassandra-cql')(express);
var cql = require('node-cassandra-cql');
var flash = require('connect-flash');
var methodOverride = require('method-override');
var session = require('express-session');
var path = require('path');

var cassandraConfig = {
  hosts: ['localhost'],
  keyspace: 'goprophet'
};
var client = new cql.Client(cassandraConfig);

var config = {
  configure: function(app) {
    app.set('views', path.join(__dirname, "../views"));
    app.set('view engine', 'jade');
    app.use(compress());
    app.use(express.static('../public'));
    app.use(flash());
    app.use(bodyParser());
    app.use(cookieparser());
    app.use(methodOverride());
    app.use(session({
      secret: 'secret-key',
      cookie: {
        secure: true
      },
      //store: new CassandraStore({client : client})
    }));
  },
  cassandra: {
    cql: cql,
    client: client
  },
  facebookStrategy: function(app){
    return {
      clientID: '656697897711155',
      clientSecret: 'da59fa7c8e4cc617c40793b45ac31b97',
      callbackURL: app.locals.domain + '/auth/facebook/callback'
    };
  }
}

module.exports = config;