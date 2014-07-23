'use strict';
(require('rootpath')());

var constants = require('config/constants');
var globals = require('config/globals');
var handlebarsHelpers = require('views/handlebarsHelpers/helpers');

var bodyParser = require('body-parser');
var busboy = require('connect-busboy');
var cookieparser = require('cookie-parser');
var compress = require('compression');
var express = require('express');
var flash = require('connect-flash');
var hbs = require('hbs');
var helmet = require('helmet');
var methodOverride = require('method-override');
var morgan = require('morgan');
var path = require('path');
var session = require('express-session');

//cassandra configurations
var cassandraConfig = {
  hosts: ['localhost'],
  keyspace: 'goprophet'
};
var cql = require('node-cassandra-cql');
var CassandraStore = require('connect-cassandra-cql')(session);
var client = new cql.Client(cassandraConfig);

//CHANGE TO PRODUCTION WHEN IN PRODUCTION
process.env.NODE_ENV = 'development';
//process.env.NODE_ENV = 'production';
var cookieConfig = (process.env.NODE_ENV === 'development') ? false : true;

//exported configurations
var config = {
  configure: function(app) {
    if (process.env.NODE_ENV === 'development') {
      app.use(morgan('dev'));
    }
    else {
      app.use(helmet());
      app.use(morgan('short'));
    }

    //configure handlebars
    for (var key in handlebarsHelpers) {
      if (handlebarsHelpers.hasOwnProperty(key)) {
        hbs.registerHelper(key, handlebarsHelpers[key]);
      }
    }
    hbs.registerPartials(path.join(__dirname, '../views/handlebarsPartials'));
    app.set('views', path.join(__dirname, '../views'));
    app.set('view engine', 'jade');
    app.engine('jade', require('jade').__express);
    app.engine('hbs', hbs.__express);
    app.use(express.static(path.join(__dirname, "../public")));
    app.use(compress());
    app.use(bodyParser());
    app.use(cookieparser());
    app.use(methodOverride());
    app.use(session({
      secret: 'secret-key',
      cookie: {
        secure: cookieConfig
      },
      //make sure cassandra is running for this to work
      store: new CassandraStore({client: client})
    }));
    app.use(flash());
    app.use(busboy());
  },
  cassandra: {
    cql: cql,
    client: client
  },
  globals: globals,
  isDev: function() {
    return process.env.NODE_ENV === 'development';
  },
  constants: constants
}

module.exports = config;