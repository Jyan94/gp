/*
 * =============================================================================
 * Author: Harrison Zhao
 * Date: 7/27/2014
 * =============================================================================
 */
/*global Highcharts*/
'use strict';

//create highcharts inside
//can change this function to load only if card is flipped over
$(function() {
  var POLL_INTERVAL = 5000;
  var MIN_Y_VAL = -1;
  var containerLabel = 'container';
  var ajaxUrl = '/getAthleteTimeseries';

  //assume these variables exist
  //proxies for now
  //in actuality make a function to get the athleteId and athleteName
  var athleteId = '00000000-0000-0000-0000-000000000000';
  var athleteName = 'hello world';

  function getRealTimeData(that, bool) {
    var series = that.series[0];
    var lastUpdate = (new Date()).getTime();
    var x;
    var y;
    //every 10 seconds query for updates
    setInterval(function() {
      $.ajax({
        url: ajaxUrl,
        type: 'GET',
        data: {
          'athleteId': athleteId,
          'timeUpdate': lastUpdate
        },

        //accepts an array with elements that have fields:
        //'dateOf(time)' and price
        success: function(data) {
          if (data.length > 0) {
            lastUpdate = (new Date()).getTime();
          }
          for (var i = 0; i !== data.length; ++i) {
            x = parseInt(data[i].timeVal);
            y = parseFloat(data[i].fantasyVal);
            series.addPoint(
              [x, y],
              false,
              true);
          }
          that.redraw();
        },
        error: function(xhr, status, err) {
          console.error(xhr, status, err);
        }
      });
    }, POLL_INTERVAL);
  }

  function loadData(initdata) {
    return initdata.map(function(point) {
      return [
        point.timeVal,
        point.fantasyVal
      ]
    });
  }

  function createChart(initData) {
    var chartFormatter = {
      renderTo: containerLabel,
      style: {
        fontFamily: "'Unica One', sans-serif"
      },
      plotBorderColor: '#FFFFF',
      events : {
        load : function() {
          getRealTimeData(this, true);
        }
      }
    };
    var zoomButtons = [{
      count: 1,
      type: 'minute',
      text: '1m'
    }, {
      count: 5,
      type: 'minute',
      text: '5m'
    }, {
      count: 30,
      type: 'minute',
      text: '30m'
    }, {
      count: 1,
      type: 'hour',
      text: '1h'
    }, {
      count: 1,
      type: 'day',
      text: '1d'
    }, {
      type: 'all',
      text: 'All'
    }];

    var chart = new Highcharts.StockChart({
      chart: chartFormatter,
      credits: {
        enabled: false
      },
      exporting: {
        enabled: false
      },
      rangeSelector: {
        buttons: zoomButtons,
        inputEnabled: false,
        selected: 2
      },
      title : {
        text : athleteName + '\'s fantasy value over time'
      },
      series: [{
        name: 'Fantasy Value',
        //color: '#000000',
        data : loadData(initData)
      }],
      xAxis: {
        title: {
            text: 'Time'
        }
      },
      yAxis: {
        min: MIN_Y_VAL,
        startOnTick: false,
        endOnTick: false,
        title: {
            text: 'Fantasy Value'
        }
      }
    });

  }
  
  //high charts below
  Highcharts.setOptions({
    global : {
      useUTC : false
    }
  });

  $.ajax({
    url: ajaxUrl,
    type: 'GET',
    data: {
      'athleteId': athleteId
    },
    success: function (data) {
      createChart(data);
    },
    error: function(xhr, status, err) {
      console.error(xhr, status, err);
    }
  });

});

