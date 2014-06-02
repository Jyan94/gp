'use strict';
var bodyParser = require('body-parser');
var cookieparser = require('cookie-parser');
var compress = require('compression');
var express = require('express');
var flash = require('connect-flash');
var methodOverride = require('method-override');
var session = require('express-session');
var path = require('path');

//cassandra configurations
var cassandraConfig = {
  hosts: ['localhost'],
  keyspace: 'goprophet'
};
var cql = require('node-cassandra-cql');
var CassandraStore = require('connect-cassandra-cql')(session);
var client = new cql.Client(cassandraConfig);

//exported configurations
var config = {
  configure: function(app) {
    app.set('views', path.join(__dirname, '../views'));
    app.set('view engine', 'jade');
    app.use(express.static(path.join(__dirname, "../public")));
    app.use(compress());
    app.use(flash());
    app.use(bodyParser());
    app.use(cookieparser());
    app.use(methodOverride());
    //basic error handler
    app.use(function(err, req, res, next) {
      console.error(err.stack);
      res.send(500, 'Something broke!');
    });
    app.use(session({
      secret: 'secret-key',
      cookie: {
        secure: false
      },
      //make sure cassandra is running for this to work
      store: new CassandraStore({client: client})
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