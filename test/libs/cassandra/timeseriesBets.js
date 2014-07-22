/*'use strict';
require('rootpath')();

var async = require('async');
var tsb = require('libs/cassandra/timeseriesBets');
var TESTID = '12000000-0000-0000-0000-000000005eb7';
var arrlength = 100; // > 0

function testInsertEach(index, callback) {
  tsb.insert(TESTID, index, function (err) {
    callback(err);
  });
}

function testInsert(callback) {
  var arr = [];
  for (var i = 0; i !== arrlength; ++i) {
    arr.push(i);
  }
  async.each(arr, testInsertEach, function(err) {
    if (err) {
      callback(err);
    }
    callback(null);
  });
}

function testSelectBeforeDelete(callback) {
  tsb.selectSinceTime(TESTID, new Date(2014, 5, 2), function (err, result) {
    if (err) {
      callback(err);
    }
    result.should.have.length(arrlength);
    result[0].should.have.property('dateOf(time)');
    result[0].should.have.property('price', 0);
    result[arrlength - 1].should.have.property('price', arrlength - 1);
    callback(null);
  })
}

function testDelete(callback) {
  tsb.deletePrices(TESTID, function (err) {
    if (err) {
      callback(err);
    }
    callback(null);
  })
}

function testSelectAfterDelete(callback) {
  tsb.selectSinceTime(TESTID, new Date(2014, 5, 2), function (err, result) {
    if (err) {
      callback(err);
    }
    result.should.have.length(0);
    callback(null);
  })
}

describe('timeseries module: insert, select, delete', function () {
  it('should return '+arrlength +' results and then delete all', 
    function(done) {
      async.waterfall([
        testDelete,
        testInsert,
        testSelectBeforeDelete,
        testDelete,
        testSelectAfterDelete
        ],
        function (err) {
          (err == null).should.be.true;
          done();
        });
    }
  );
});*/