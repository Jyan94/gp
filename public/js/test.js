$(function() {

  function loadData() {

    // set up the updating of the chart each second
    var series = this.series[0];
    setInterval(function() {
    var x = (new Date()).getTime(), // current time
    y = Math.round(Math.random() * 100);
    series.addPoint([x, y], true, true);
    }, 1000);
  }

  function displayRealtimeData() {
    // generate an array of random data
    var data = [], time = (new Date()).getTime(), i;

    for( i = -999; i <= 0; i++) {
      data.push([
        time + i * 1000,
        time
        ]);
    }
    return data;
  }

  var zoom = [
  {
    count: 1,
    type: 'minute',
    text: '1min'
  }, {
    count: 5,
    type: 'minute',
    text: '5min'
  }, {
    count: 30,
    type: 'minute',
    text: '30min'
  }, {
    type: 'all',
    text: 'All'
  }];


  //high charts below
  Highcharts.setOptions({
    global : {
      useUTC : false
    }
  });

  // Create the chart
  $('#container').highcharts('StockChart', {
    chart : {
      events : {
        load : loadData
      }
    },

    rangeSelector: {
      buttons: [{
        count: 1,
        type: 'minute',
        text: '1M'
      }, {
        count: 5,
        type: 'minute',
        text: '5M'
      }, {
      }, {
        type: 'all',
        text: 'All'
      }],
        inputEnabled: false,
        selected: 0
      },

      title : {
        text : 'Live random data'
      },

      exporting: {
        enabled: false
      },

      series : [{
        name : 'Random data',
        data : displayRealtimeData()
      }]
  });

});
