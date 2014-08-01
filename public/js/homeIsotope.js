// debounce so filtering doesn't happen every millisecond
function debounce( fn, threshold ) {
  var timeout;
  return function debounced() {
    if ( timeout ) {
      clearTimeout( timeout );
    }
    function delayed() {
      fn();
      timeout = null;
    }
    timeout = setTimeout( delayed, threshold || 100 );
  }
}

$( function() {
  // quick search regex
  var qsRegex;
  var buttonFilter;
  var overUnderFilter;
  var wageResultFilter;
  var fantasyResultFilter;
  // init Isotope
  var $container = $('.isotope').isotope({
    itemSelector: '.playercard1',
    layoutMode: 'fitRows',
    filter: function() {
      var $this = $(this);
      var searchResult = qsRegex ? $this.text().match( qsRegex ) : true;
      var buttonResult = buttonFilter ? $this.is(buttonFilter) : true;
      var overUnderResult = overUnderFilter ? $this.is(overUnderFilter) : true;
      var wageResult = wageResultFilter ? $this.is(wageResultFilter) : true;
      var fantasyResult = fantasyResultFilter ? $this.is(fantasyResultFilter) : true;
      return searchResult && buttonResult && overUnderResult && wageResult && fantasyResult;
    }
    /*getSortData: {
      nfl: '.Football',
      nba: '.Basketball',
      mlb: '.Baseball',
    }*/
  });


    // filter functions
  var filterFns = {
    wager: function() {
      var wageBottom = $('#slider-range').slider("values", 0);
      var wageTop = $('#slider-range').slider("values", 1);
      var wager = $(this).find('.playercard1-bottom.wager').text().split(" ")[0].substring(1);
      return (parseFloat(wager) >= parseFloat(wageBottom)
              && parseFloat(wager) <= parseFloat(wageTop));
    },
    over: function() {
      var overOrUnder = $(this).find('.playercard1-bottom.wager').text().split(" ")[1];
      console.log(overOrUnder);
      console.log(overOrUnder.match(/over/));
      return overOrUnder.match(/over/);
    },
    under: function() {
      var overOrUnder = $(this).find('.playercard1-bottom.wager').text().split(" ")[1];
      console.log(overOrUnder);
      console.log(overOrUnder.match(/under/));
      return overOrUnder.match(/under/);
    },
    fantasyValue: function() {
      var fantasyBottom = $('#slider-range2').slider("values", 0);
      var fantasyTop = $('#slider-range2').slider("values", 1);
      var fantasy = $(this).find('.playercard1-bottom.wager').text().split(" ")[2];
      return (parseFloat(fantasy) >= parseFloat(fantasyBottom)
              && parseFloat(fantasy) <= parseFloat(fantasyTop));
    }
  };

  // bind filter button click
  $('#filters').on( 'click', 'button', function() {
    var $this = $(this);
    buttonFilter = $this.attr('data-filter');
    //buttonFilter = filterFns[buttonFilter] || buttonFilter
    // use filterFn if matches value
    //var $buttonGroup = $this.parents('.button-group');
    //var overUnderValue = $buttonGroup.attr('data-filter-group');
    $container.isotope();
  });

  $('#filters1').on('click', 'button', function() {
    overUnderFilter = $(this).attr('data-filter');
    overUnderFilter = filterFns[ overUnderFilter ] || overUnderFilter;
    $container.isotope();
  })

  // use value of search field to filter
  var $quicksearch = $('#quicksearch').keyup( debounce( function() {
    qsRegex = new RegExp( $quicksearch.val(), 'gi' );
    $container.isotope();
  }) );

  $('#slider-range').on('slidechange', function() {
    wageResultFilter = $(this).attr('data-filter');
    wageResultFilter = filterFns[wageResultFilter] || wageResultFilter;
    $container.isotope();
  })


  $('#slider-range2').on('slidechange', function() {
    fantasyResultFilter = $(this).attr('data-filter');
    fantasyResultFilter = filterFns[fantasyResultFilter] || wageResultFilter;
    $container.isotope();
  })


  /*
  var $filterwager = $('#filter').keyup(function(wageBottom, wageTop) {
    var $this = $(this);

    var wager = $(this).find('.playercard1-bottom.wager').text().split(" ")[0];
    //parseFlaot vs parseDouble??
    return (parseFloat(wager) > wageBottom
            && parseFloat(wager) < wageTop);
    },
  }));

  var $filtervalue = $('#filter2').keyup(debounce(function() {
    $container.isotope({filter: value});
  })*/

    // change is-checked class on buttons
  $('.button-group').each( function( i, buttonGroup ) {
    var $buttonGroup = $( buttonGroup );
    $buttonGroup.on( 'click', 'button', function() {
      $buttonGroup.find('.is-checked').removeClass('is-checked');
      $( this ).addClass('is-checked');
    });
  });

});
