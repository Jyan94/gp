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
(function(exports) {
  //PARAMETERS:
  //id is container for graph id
  //athName is athlete full name (for title display)
  //athId is athlete id for querying backend
  function createGraph(id, athName, athId) {
    var POLL_INTERVAL = 5000;
    var MIN_Y_VAL = -3;
    var containerLabel = id;
    var ajaxUrl = '/getAthleteTimeseries';

    //assume these variables exist
    //proxies for now
    //in actuality make a function to get the athleteId and athleteName
    var athleteId = athId;
    var athleteName = athName;

    function getRealTimeData(chart) {
      var series = chart.series[0];
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
          //timeVal and fantasyVal
          success: function(data) {
            if (data.length > 0) {
              lastUpdate = (new Date()).getTime();
              if (data[0].timeVal < 
                  series.points[series.points.length - 1].timeVal) {
                series.points[series.points.length - 1].remove();
              }
            }

            for (var i = 0; i !== data.length; ++i) {
              x = parseInt(data[i].timeVal);
              y = parseFloat(data[i].fantasyVal);
              series.addPoint(
                [x, y],
                false);
            }

            series.addPoint([
              (new Date()).getTime(), 
              series.yData[series.yData.length - 1]
            ]);
            
            chart.redraw();
          },
          error: function(xhr, status, err) {
            console.error(xhr, status, err);
          }
        });
      }, POLL_INTERVAL);
    }

    function loadData(initdata) {
      var retArr = initdata.map(function(point) {
        return [
          point.timeVal,
          point.fantasyVal
        ]
      });
      retArr.push([(new Date()).getTime(), retArr[retArr.length - 1][1]]);
      return retArr;
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
            getRealTimeData(this);
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
          //default show all at once
          selected: 5
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
  }
  exports.createGraph = createGraph;

}(typeof exports === 'undefined' ? 
    window.timeseries = {} : 
    exports));

