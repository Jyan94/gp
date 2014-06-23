'use strict';
(require('rootpath')());

var constants = require('config/constants');
var bodyParser = require('body-parser');
var busboy = require('connect-busboy');
var cookieparser = require('cookie-parser');
var compress = require('compression');
var express = require('express');
var flash = require('connect-flash');
var methodOverride = require('method-override');
var morgan = require('morgan');
var session = require('express-session');
var path = require('path');
var multiline = require('multiline');

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
    //use helmet too
    app.use(morgan('dev'));
    app.set('views', path.join(__dirname, '../views'));
    app.set('view engine', 'jade');
    app.engine('jade', require('jade').__express);
    app.engine('ejs', require('ejs').renderFile);
    app.use(express.static(path.join(__dirname, "../public")));
    app.use(compress());
    app.use(flash());
    app.use(bodyParser());
    app.use(cookieparser());
    app.use(methodOverride());
    //basic error handler
    app.use(session({
      secret: 'secret-key',
      cookie: {
        secure: false
      },
      //make sure cassandra is running for this to work
      store: new CassandraStore({client: client})
    }));
    app.use(busboy());
  },
  cassandra: {
    cql: cql,
    client: client
  },
  constants: constants
}

module.exports = config;