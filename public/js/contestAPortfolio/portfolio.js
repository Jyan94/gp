/*
 * =============================================================================
 * Author: Harrison Zhao
 * Date: 8/5/2014
 * =============================================================================
 */
/*global Highcharts*/
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

  /**
   * wrapper for objects received from server
   * @type {Object}
   * has fields:
   *   takenAthletesList: array of user's taken bet athletes
   *   takenAthletesIdMap: map of athleteId to index in taken array
   *   pendingAthletesList: array of user's pending athletes
   *   pendingAthletesIdMap: map of athleteId to index in pending array
   *   resellAthletesList: array of user's resell athletes
   *   resellAthletesIdMap: map of athleteId to index in resell array
   */
  var dataWrapper = {};

  function getRealTimeData(chart) {
    var allSeries = chart.series;
    var lastUpdate = (new Date()).getTime();
    //every 10 seconds query for updates
    setInterval(function() {
      $.ajax({
        url: updateAjaxUrl,
        type: 'GET',
        data: {
          'athleteIds': dataWrapper.pendingAthletesIds,
          'timeUpdate': lastUpdate
        },
        success: function(data) {
          for (var i = 0; i !== data.length; ++i) {
            if (data[i].length > 0) {
              lastUpdate = (new Date()).getTime();
              break;
            }
          }
          data.map(function(data, index) {
            var j, x, y;
            for (j = 0; j !== data.length; ++j) {
              x = parseInt(data[j].timeVal);
              y = parseFloat(data[j].fantasyVal);
              allSeries[index].addPoint([x, y], false);
            }
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
    plotOptions: {
      line: {
        dataLabels: {
            enabled: true
        },
      }
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
    for (i = 0; i !== data.timeseriesList.length; ++i) {
      chart.addSeries(
        {
          color: getRandomDarkColor(),
          data: data.timeseriesList[i].map(mapFunc),
          name: dataWrapper.pendingAthletesList[i].fullName
        }, 
        false);
    }
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
    /*for (i = 0; i !== dataWrapper.takenAthletesList.length; ++i) {
      $takenContainer.data('isotope').insert();
    }
    for (i = 0; i !== dataWrapper.pendingAthletesList.length; ++i) {
      $pendingContainer.data('isotope').insert();
    }*/
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

