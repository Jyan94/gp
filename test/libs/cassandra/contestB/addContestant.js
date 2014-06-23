'use strict';
(require('rootpath')());

require('test/testConfigs/setupTest');
var UpdateContest = require('libs/cassandra/contestB/update');
var InitContest = require('libs/contestB/modes');
var AddContestant = require('libs/cassandra/contestB/addContestant');
var async = require('async');

async.waterfall([
]);

require('test/testConfigs/takedownTest');