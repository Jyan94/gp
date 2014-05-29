'use strict';
var cookieparser = require('cookie-parser');
var methodOverride = require('method-override');
var bodyParser = require('body-parser');
var session = require('express-session');
var cql = require('node-cassandra-cql');
var client = new cql.Client(require('./cassandraConfig'));
var CassandraStore = require('connect-cassandra-cql')(require('express'));

var config = {
  configure: function(app) {
    app.locals({
      title: "goprophet",
      flash: {}
    });
    app.set('view engine', 'jade');
  },
  cassandraConfig: {
    configure: function(app) {
      app.use(bodyParser());
      app.use(cookieparser());
      app.use(methodOverride());
      app.use(session({
        secret: 'secret-key',
        cookie: {
          secure: true
        },
        store: new CassandraStore({client : client})
      }));
    },
    cql: cql,
    client: client
  },
  facebookStrategy: function(app){
    return {
      clientID: '656697897711155',
      clientSecret: 'da59fa7c8e4cc617c40793b45ac31b97',
      callbackURL: app.locals.domain + '/auth/facebook/callback'
    }
  }
}

module.exports = config;