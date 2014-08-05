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

    // change is-checked class on buttons
  $('.button-group').each( function( i, buttonGroup ) {
    var $buttonGroup = $( buttonGroup );
    $buttonGroup.on( 'click', 'button', function() {
      $buttonGroup.find('.is-checked').removeClass('is-checked');
      $( this ).addClass('is-checked');
    });
  });

});

function getPlayercard1Scale (currentTarget) {
  var windowWidthScale = ($(window).width() * 0.8) / 320;
  var windowHeightScale = ($(window).height() * 0.8) / 250;

  return (windowWidthScale > windowHeightScale ? windowHeightScale : windowHeightScale);
}

$(function () {
  var flippedCard = -1;
  var flippedCardOffset = {};
  var transitionDone = true;

  var activeTabIndex = -1;
  var tabNames = ['tab-1', 'tab-2', 'tab-3'];

  $('.isotope').on('click', '.playercard1', function (e) {
    if ((e.target.className === 'pure-button button-primary')
        || (flippedCard >= 0) || !(transitionDone)) {
      return true;
    }

    transitionDone = false;

    $('#marketHome-backdrop').addClass('active');

    //console.log(e);
    flippedCard = e.currentTarget.id.substring(12);
    var currentTarget = $('#' + e.currentTarget.id);

    flippedCardOffset = currentTarget.offset();
    var fixedOffsetX = flippedCardOffset.left - $(window).scrollLeft() - 10;
    var fixedOffsetY = flippedCardOffset.top - $(window).scrollTop() - 10;
    var scale = getPlayercard1Scale(currentTarget);

    currentTarget.css({'position': 'fixed',
                       'top': fixedOffsetY + 'px',
                       'left': fixedOffsetX + 'px',
                       'z-index': 5});
    console.log(currentTarget.offset().left);
    currentTarget.addClass('transition');
    currentTarget.css({'top': 'calc(50% - 170px)',
                       'left': 'calc(50% - 135px)',
                       '-webkit-transform': 'scale(' + scale + ') rotateY(180deg) rotateZ(90deg) translateZ(-1px)'});
    currentTarget.addClass('flipped');
    currentTarget.bind("webkitTransitionEnd", function(e){ 
      $(this).unbind(e);
      transitionDone = true;
    });

    return false;
  });

  $('.backdrop').on('click', function (e) {
    if ((flippedCard >= 0) && transitionDone) {
      transitionDone = false;

      $('#marketHome-backdrop').removeClass('active');

      var prevFlippedCard = flippedCard;
      flippedCard = -1;

      var currentTarget = $('#playercard1-' + prevFlippedCard);
      var scale = currentTarget.css('-webkit-transform').match(/(-?[0-9\.]+)/g)[2];

      var currentTargetOffset = currentTarget.offset();
      var absoluteOffsetX = currentTargetOffset.left + (160 * scale) - 255; //is originally 120px + 10px + 125px = 255px away needs to be 320 now
      var absoluteOffsetY = currentTargetOffset.top + (125 * scale) - 170; //is originally 160px + 10px = 170px away needs to be 250 now

      currentTarget.removeClass('transition');
      currentTarget.css({'position': 'absolute',
                         'top': absoluteOffsetY + 'px',
                         'left': absoluteOffsetX + 'px',
                         'z-index': ''});
      console.log(currentTarget.offset().left);
      currentTarget.addClass('transition');
      currentTarget.css({'top': flippedCardOffset.top - 10 + 'px',
                         'left': flippedCardOffset.left - 130  + 'px',
                         '-webkit-transform': ''});
      currentTarget.removeClass('flipped');
      currentTarget.bind("webkitTransitionEnd", function(e){ 
        $(this).unbind(e);
        currentTarget.removeClass('transition');
        transitionDone = true;
      });
    }

    return false;
  });
  
  $(window).resize(function (e) {
    if (flippedCard >= 0) {
      var currentTarget = $('#'+ $('.flipped')[0].id);
      var scale = getPlayercard1Scale(currentTarget);

      currentTarget.css({'-webkit-transform': 'scale(' + scale + ') rotateY(180deg) rotateZ(90deg) translateZ(-1px)'});
    }

    return false;
  });

  $('.isotope').on('click', '.playercard1-back', function (e) {
    if (e.target.className.slice(0, 20) === 'playercard1-back-tab') {
      var currentTargetId = e.target.id;
      var currentTargetCardPrefix = '#' + currentTargetId.slice(0, currentTargetId.length - 6) + '-';

      for (var i = 0; i < tabNames.length; i++) {
        if (currentTargetId.substring(currentTargetId.length - 5) === tabNames[i]) {
          activeTabIndex = i;
        }
        else {
          $(currentTargetCardPrefix + tabNames[i]).removeClass('active');
          $(currentTargetCardPrefix + tabNames[i] + '-content').css('display', 'none');
        }
      }

      $(currentTargetCardPrefix + tabNames[activeTabIndex] + '-content').fadeIn();
      $(currentTargetCardPrefix + tabNames[activeTabIndex]).addClass('active');
    }

    return false;
  });
});
