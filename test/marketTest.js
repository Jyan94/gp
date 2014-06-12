'use strict';
require('rootpath')();

var async = require('async')
var Market = require('routes/market')
var TESTID = '12000000-0000-0000-0000-000000005eb7';


describe('getBetInfosFromPlayerId', function() {
  it('should return Betinfos From Player Id', function(done) {
    var profile = {

    }
  }
})
function getBetInfosFromPlayerId(callback){
  Market.getBetInfosFromPlayerId(req, res, next, function(err) {
    if (err) {
      callback(err);
    }
    callback()
  }

}