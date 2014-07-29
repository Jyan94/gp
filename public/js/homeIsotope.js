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
  // init Isotope
  var $container = $('.isotope').isotope({
    itemSelector: '.playercard1',
    layoutMode: 'fitRows',
    filter: function() {
      var $this = $(this);
      var searchResult = qsRegex ? $this.text().match( qsRegex ) : true;
      var buttonResult = buttonFilter ? $this.is(buttonFilter) : true;
      var overUnderResult = overUnderFilter ? $this.is(overUnderFilter) : true;
      return searchResult && buttonResult;
    }
    /*getSortData: {
      nfl: '.Football',
      nba: '.Basketball',
      mlb: '.Baseball',
    }*/
  });


    // filter functions
  /*var filterFns = {
    wager: function(wageBottom, wageTop) {
      var wager = $(this).find('.playercard1-bottom.wager').text().split(" ")[0];
      //parseFlaot vs parseDouble??
      return (parseFloat(wager) > wageBottom
              && parseFloat(wager) < wageTop);
    },
    over: function() {
      var overOrUnder = $(this).find('.playercard1-bottom.wager').text().split(" ")[1];
      return overOrUnder.match(/over/);
    },
    under: function() {
      var overOrUnder = $(this).find('.playercard1-bottom.wager').text().split(" ")[1];
      return overOrUnder.match(/under/);
    },
    fantasyValue: function(fantasyValueBottom, fantasyValueTop) {
      var fantasyValue = $(this).find('.playercard1-bottom.wager').text().split(" ")[2];
      return (parseFloat(fantasyValue) > fantasyValueBottom
              && parseFloat(fantasyValue) < fantasyValueTop);
    }
  };
*/
  // bind filter button click
  $('#filters').on( 'click', 'button', function() {
    var $this = $(this);
    buttonFilter = $this.attr('data-filter');
    // use filterFn if matches value
    var $buttonGroup = $this.parents('.button-group');
    //var overUnderValue = $buttonGroup.attr('data-filter-group');
    /*var overUnderValue = $this.attr('data-filter');
    overUnderFilter = filterFns[ overUnderValue ] || overUnderValue;*/
    $container.isotope();
  });

  // use value of search field to filter
  var $quicksearch = $('#quicksearch').keyup( debounce( function() {
    qsRegex = new RegExp( $quicksearch.val(), 'gi' );
    $container.isotope();
  }) );

    // change is-checked class on buttons
  $('.button-group').each( function( i, buttonGroup ) {
    var $buttonGroup = $( buttonGroup );
    $buttonGroup.on( 'click', 'button', function() {
      $buttonGroup.find('.is-checked').removeClass('is-checked');
      $( this ).addClass('is-checked');
    });
  });

});
