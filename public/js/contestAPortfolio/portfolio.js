/*
 * =============================================================================
 * Author: Harrison Zhao
 * Date: 8/5/2014
 * =============================================================================
 */
/*global Highcharts*/
/*global portfolioCreateAthleteCard*/
'use strict';

$(function() {
  //tab stuff
  var activeTabIndex = -1;
  var tabNames = ['portfolio-tab-1', 'portfolio-tab-2'/*, 'portfolio-tab-3'*/]
  
  $('.portfolio-tab').click(function (event) {
    for (var i = 0; i < tabNames.length; i++) {
      if (event.target.id === tabNames[i]) {
        activeTabIndex = i;
      }
      else {
        $('#' + tabNames[i]).removeClass('active');
        $('#' + tabNames[i] + '-content').css('display', 'none');
      }
    }

    $('#' + tabNames[activeTabIndex] + '-content').fadeIn();
    $('#' + tabNames[activeTabIndex]).addClass('active');

    return false;
  });

  //timeseries and isotope stuff
  var POLL_INTERVAL = 10000;
  var MIN_Y_VAL = -3;
  var containerLabel = 'graph-container';
  var ajaxUrl = '/initPortfolio';
  var updateAjaxUrl = '/getMultiAthleteTimeseries';
  var takenColors = {};
  var MAX_SERIES = 5;

  /**
   * wrapper for objects received from server
   * @type {Object}
   * has fields:
   *   takenBets: array of taken bets
   *   takenAthletesList: array of user's taken bet athletes
   *   takenAthletesIdMap: map of athleteId to index in taken array
   *   pendingBets: array of pending bets
   *   pendingAthletesList: array of user's pending athletes
   *   pendingAthletesIdMap: map of athleteId to index in pending array
   *   resellBets: array of resell bets
   *   resellAthletesList: array of user's resell athletes
   *   resellAthletesIdMap: map of athleteId to index in resell array
   */
  var dataWrapper = {};
  var timeseriesAthleteIds = [];

  function getRealTimeData(chart) {
    var lastUpdate = (new Date()).getTime();
    var timeNow;
    var i;
    //every 10 seconds query for updates
    setInterval(function() {
      $.ajax({
        url: updateAjaxUrl,
        type: 'GET',
        data: {
          'athleteIds': timeseriesAthleteIds,
          'timeUpdate': lastUpdate
        },
        success: function(data) {
          for (i = 0; i !== data.length; ++i) {
            if (data[i].length > 0) {
              lastUpdate = (new Date()).getTime();
              break;
            }
          }
          for (i = 0; i !== data.length; ++i) {
            if (data[i].length > 0 && 
                data[i][0].timeVal < 
                  chart.series[i].points[chart.series[i].points.length - 1]) {

              chart.series[i]
                .points[chart.series[i].points.length - 1].remove();
            }
          }
          //remove the most recent point artificially added to extend graph
          /*chart.series.map(function(series) {
            series.points[series.points.length - 1].remove();
          });*/
          data.map(function(data, index) {
            var j, x, y;
            for (j = 0; j !== data.length; ++j) {
              x = parseInt(data[j].timeVal);
              y = parseFloat(data[j].fantasyVal);
              chart.series[index].addPoint([x, y], false);
            }
          });
          //artificially extend chart again
          timeNow = (new Date()).getTime();
          //need this in order to make sure the 0th series catches up
          //very strange highstocks visual bug
          /*if (chart.series[0]) {
            chart.series[0].addPoint(
              [
                timeNow,
                chart.series[0].yData[chart.series[0].yData.length - 1]
              ]);
            chart.series[0].points[chart.series[0].points.length - 1].remove();
          }*/
          chart.series.map(function(series) {
            series.addPoint(
              [
                timeNow, 
                series.yData[series.yData.length - 1]
              ]);
          });
          chart.redraw();
        },
        error: function(xhr, status, err) {
          console.error(xhr, status, err);
        }
      });
    }, POLL_INTERVAL);
  }

  function loadData(initdata) {
    dataWrapper = initdata;
    return initdata.map(function(point) {
      return [
        point.timeVal,
        point.fantasyVal
      ]
    });
  }

  var chartFormatter = {
    animation: false,
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
      selected: 2
    },
    series: [],
    title : {
      text : 'Pending bet athletes fantasy value over time'
    },
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
  
  function getRandomDarkColor() {
      var letters = '012345'.split('');
      var color = '#';        
      color += letters[Math.round(Math.random() * 5)];
      letters = '0123456789ABCDEF'.split('');
      for (var i = 0; i < 5; i++) {
        color += letters[Math.round(Math.random() * 15)];
      }
      if (takenColors[color]) {
        return getRandomDarkColor();
      }
      else {
        return color;
      }
  }

  function initializePortfolio(data) {
    dataWrapper = data.data;
    var mapFunc = function (dataPoint) {
      return [dataPoint.timeVal, dataPoint.fantasyVal];
    };
    var i;
    timeseriesAthleteIds = data
      .data
      .takenAthletesList
      .slice(0, MAX_SERIES)
      .map(function(athlete) {
        return athlete.id;
      });
    for (i = 0; i !== data.timeseriesList.length && i < MAX_SERIES; ++i) {
      chart.addSeries(
        {
          color: getRandomDarkColor(),
          data: data.timeseriesList[i].map(mapFunc),
          name: dataWrapper.takenAthletesList[i].fullName
        }, 
        false);
    }
    //extends the current fantasy value of each series to the current time
    //[1] is the index of the y value of the series
    //each series is represented as [[x1, y1], [x2, y2], ...]
   // console.log(chart.series[0].data.length);
    var timeNow = (new Date()).getTime();
    chart.series.map(function(series) {
      series.addPoint(
        [
          timeNow, 
          series.yData[series.yData.length - 1]
        ]);
    });
    //console.log(typeof(chart.series[0].data));
    //console.log(chart.series[0].yData.length);
    //console.log(chart.series[0].points.length);
    chart.redraw();
    var $pendingContainer = $('.isotope-pending');
    $pendingContainer.isotope({
      itemSelector: '.playercard1',
      layoutMode: 'fitRows'
    });
    var $takenContainer = $('.isotope-taken');
    $takenContainer.isotope({
      itemSelector: '.playercard1',
      layoutMode: 'fitRows'
    });
    //var $resellContainer = $('.resell-container');
    //insert the stuff
    for (i = 0; i !== dataWrapper.takenBets.length; ++i) {
      $takenContainer.data('isotope').insert(
        portfolioCreateAthleteCard.createCard(dataWrapper.takenBets[i]));
    }
    for (i = 0; i !== dataWrapper.pendingBets.length; ++i) {
      $pendingContainer.data('isotope').insert(
        portfolioCreateAthleteCard.createCard(dataWrapper.pendingBets[i]));
    }
    /*for (i = 0; i !== dataWrapper.resellAthletesList.length; ++i) {
      $resellContainer.data('isotope').insert();
    }*/
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
    success: function (data) {
      initializePortfolio(data);
    },
    error: function(xhr, status, err) {
      console.error(xhr, status, err);
    }
  });

});

