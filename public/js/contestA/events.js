/*
 * =============================================================================
 * Author: Harrison Zhao
 * Date: 8/5/2014
 * =============================================================================
 */

/*global contestALoadAthletesCache*/
/*global contestALoadGamesCache*/
/*global initializeCaches*/
/*global contestAGetBets*/
'use strict';

(function(exports)  {
  var DELIM = '-';

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

  //initialization of isotope container and filters
  (function () {
    var qsRegex;
    var buttonFilter;
    var overUnderFilter;
    var wageResultFilter;
    var fantasyResultFilter;

    var $container = contestAGetBets.setIsotopeContainer($('.isotope'));
    $container.isotope({
      itemSelector: '.playercard1',
      layoutMode: 'fitRows',
      getSortData: {
        id: '.id'
      },
      filter: function() {
        var $this = $(this);
        var searchResult = qsRegex ? $this.text().match( qsRegex ) : true;
        var buttonResult = buttonFilter ? $this.is(buttonFilter) : true;
        var overUnderResult = overUnderFilter ?
          $this.is(overUnderFilter) : true;
        var wageResult = wageResultFilter ? $this.is(wageResultFilter) : true;
        var fantasyResult = fantasyResultFilter ?
          $this.is(fantasyResultFilter) : true;
        return searchResult &&
          buttonResult && overUnderResult && wageResult && fantasyResult;
      }
    });

    contestAGetBets.requestGetAndUpdateBets();

    var filterFns = {
      wager: function() {
        var wageBottom = $('#slider-range').slider("values", 0);
        var wageTop = $('#slider-range').slider("values", 1);
        var wager = $(this).find('.playercard1-bottom.wager')
          .text().split(" ")[0].substring(1);
        return (parseFloat(wager) >= parseFloat(wageBottom)
                && parseFloat(wager) <= parseFloat(wageTop));
      },
      over: function() {
        var overOrUnder = $(this)
          .find('.playercard1-bottom.wager')
          .text()
          .split(" ")[1];
        console.log(overOrUnder);
        console.log(overOrUnder.match(/over/));
        return overOrUnder.match(/over/);
      },
      under: function() {
        var overOrUnder = $(this)
          .find('.playercard1-bottom.wager')
          .text()
          .split(" ")[1];
        console.log(overOrUnder);
        console.log(overOrUnder.match(/under/));
        return overOrUnder.match(/under/);
      },
      fantasyValue: function() {
        var fantasyBottom = $('#slider-range2').slider("values", 0);
        var fantasyTop = $('#slider-range2').slider("values", 1);
        var fantasy = $(this)
          .find('.playercard1-bottom.wager')
          .text()
          .split(" ")[2];
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
  })();

  function getPlayercard1Scale (currentTarget) {
    var windowWidthScale = ($(window).width() * 0.8) / 320;
    var windowHeightScale = ($(window).height() * 0.8) / 250;

    return (windowWidthScale > windowHeightScale ?
      windowHeightScale : windowHeightScale);
  }

  (function () {
    var flippedCard = -1;
    var flippedCardOffset = {};
    var transitionDone = true;

    var activeTabIndex = -1;
    var tabNames = ['tab-1', 'tab-2', 'tab-3'];

    $('.isotope').on('click', '.playercard1', function (e) {
      if ((flippedCard >= 0) || !(transitionDone)) {
        $.noop();
      }
      else if (e.target.className
               === 'pure-button button-primary take-bet-button') {
        var arrayIndex = e.currentTarget.id.substring(
          e.currentTarget.id.indexOf(DELIM) + 1);
        var bet = contestAGetBets.getBetByIndex(arrayIndex);
        $.ajax({
          url: '/takePendingBet',
          type: 'GET',
          dataType: 'json',
          data: {
            athleteId: bet.athleteId,
            athleteName: bet.athleteName,
            athleteTeam: bet.athleteTeam,
            betId: bet.betId,
            fantasyValue: bet.fantasyValue,
            gameId: bet.gameId,
            opponent: bet.bettor,
            overNotUnder: bet.overNotUnder,
            payoff: bet.payoff,
            price: bet.price
          },
          success: function(message) {
            //preferably show a message for 2 seconds
            console.log(message);
          },
          error: function(xhr, status, err) {
            console.error(xhr, status, err);
          }
        });
      }
      else {
        transitionDone = false;

        var currentTarget = $('#' + e.currentTarget.id);
        currentTarget.addClass('flipped');
        flippedCard = e.currentTarget.id.substring(
          e.currentTarget.id.indexOf(DELIM) + 1);

        $('#marketHome-backdrop').addClass('active');

        flippedCardOffset = currentTarget.offset();
        var fixedOffsetX = flippedCardOffset.left - $(window).scrollLeft() - 10;
        var fixedOffsetY = flippedCardOffset.top - $(window).scrollTop() - 10;
        var scale = getPlayercard1Scale(currentTarget);

        currentTarget.css({'position': 'fixed',
                           'top': fixedOffsetY + 'px',
                           'left': fixedOffsetX + 'px'});
        console.log(currentTarget.offset().left);
        currentTarget.addClass('transition');
        currentTarget.css({'top': 'calc(50% - 170px)',
                           'left': 'calc(50% - 135px)',
                           '-webkit-transform':
                           'scale(' + scale + ')' +
                           ' rotateY(180deg) rotateZ(90deg) translateZ(-1px)'});
        currentTarget.bind("webkitTransitionEnd", function(e){
          $(this).unbind(e);
          transitionDone = true;
        });
      }

      e.preventDefault();
    });

    $('.backdrop').on('click', function (e) {
      if ((flippedCard >= 0) && transitionDone) {
        transitionDone = false;

        var prevFlippedCard = flippedCard;
        flippedCard = -1;

        var currentTarget = $('#playercard1-' + prevFlippedCard);
        var scale = currentTarget.css('-webkit-transform')
          .match(/(-?[0-9\.]+)/g)[2];

        $('#marketHome-backdrop').removeClass('active');

        var currentTargetOffset = currentTarget.offset();
        var absoluteOffsetX = currentTargetOffset.left + (160 * scale) - 255;
        //is originally 120px + 10px + 125px = 255px away needs to be 320 now
        var absoluteOffsetY = currentTargetOffset.top + (125 * scale) - 170;
        //is originally 160px + 10px = 170px away needs to be 250 now

        currentTarget.removeClass('transition');
        currentTarget.css({'position': 'absolute',
                           'top': absoluteOffsetY + 'px',
                           'left': absoluteOffsetX + 'px'});
        console.log(currentTarget.offset().left);
        currentTarget.addClass('transition');
        currentTarget.css({'top': flippedCardOffset.top - 10 + 'px',
                           'left': flippedCardOffset.left - 130  + 'px',
                           '-webkit-transform': ''});
        currentTarget.bind("webkitTransitionEnd", function(e){
          $(this).unbind(e);
          currentTarget.removeClass('transition');
          currentTarget.removeClass('flipped');
          transitionDone = true;
        });
      }

      e.preventDefault();
    });

    $(window).resize(function (e) {
      if (flippedCard >= 0) {
        var currentTarget = $('#'+ $('.flipped')[0].id);
        var scale = getPlayercard1Scale(currentTarget);

        currentTarget.css({'-webkit-transform': 'scale(' + scale + ')' +
          'rotateY(180deg) rotateZ(90deg) translateZ(-1px)'});
      }

      e.preventDefault();
    });

    $('.isotope').on('click', '.playercard1-back', function (e) {
      if (e.target.className.slice(0, 20) === 'playercard1-back-tab') {
        var currentTargetId = e.target.id;
        var currentTargetCardPrefix = '#' +
          currentTargetId.slice(0, currentTargetId.length - 6) + '-';

        for (var i = 0; i < tabNames.length; i++) {
          if (currentTargetId
            .substring(currentTargetId.length - 5) === tabNames[i]) {
            activeTabIndex = i;
          }
          else {
            $(currentTargetCardPrefix + tabNames[i]).removeClass('active');
            $(currentTargetCardPrefix + tabNames[i] + '-content')
              .css('display', 'none');
          }
        }

        $(currentTargetCardPrefix + tabNames[activeTabIndex] + '-content')
          .fadeIn();
        $(currentTargetCardPrefix + tabNames[activeTabIndex])
          .addClass('active');
      }

      e.preventDefault();
    });
  })();

  //make bet form
  //create bet
  (function () {
    var wagerAmount = $('#wagerAmount').val();
    var fantasyValue = $('#fantasyValue').val();
    var overUnder;
    if ($('input[type=\'radio\']:checked')[0].value === 'Over') {
      console.log($('input[type=\'radio\']:checked')[0].value);
      overUnder = 'under';
    }
    else {
      console.log($('input[type=\'radio\']:checked')[0].value);
      overUnder = 'over';
    }

    // Hover states on the static widgets
    $('#dialog-link, #icons li').hover(
      function() {
        $( this ).addClass('ui-state-hover');
      },
      function() {
        $( this ).removeClass('ui-state-hover');
      }
    );
    $('#wagerAmount, #fantasyValue').on('input', debounce(function () {
      wagerAmount = $('#wagerAmount').val();
      fantasyValue = $('#fantasyValue').val();

      var playerString = "$" + wagerAmount +
        " " + overUnder + " " + fantasyValue + " FP";
      $('.playercard1#create')
        .find('.playercard1-bottom.wager p')
        .replaceWith('<p>' + playerString + '</p');
    }, 500));

    $('input[type=\'radio\']').on('change', function() {
      var overUnder;
      if ($('input[type=\'radio\']:checked')[0].value === 'Over') {
        console.log($('input[type=\'radio\']:checked')[0].value);
        overUnder = 'under';
      }
      else {
        console.log($('input[type=\'radio\']:checked')[0].value);
        overUnder = 'over';
      }
      //overUnder = $('input[type=\'radio\']:checked')[0].value.toLowerCase();

      var playerString = "$" + wagerAmount +
        " " + overUnder + " " + fantasyValue + " FP";
      $('.playercard1#create')
      .find('.playercard1-bottom.wager p')
      .replaceWith('<p>' + playerString + '</p');
    });

    //create bet
    $('#betForm').submit(function(e) {
      e.preventDefault();
      var athleteObj = initializeCaches.getSearchedAthleteObj();

      if (athleteObj) {
        var gameId = contestALoadGamesCache.getGameIdByLongTeamName(
              athleteObj.longTeamName);

        $.ajax({
          url:'/placePendingBet',
          type: 'POST',
          dataType: 'json',
          data: {
            athleteId: athleteObj.id,
            athleteImage: athleteObj.image,
            athleteName: athleteObj.fullName,
            athletePosition: athleteObj.position,
            athleteTeam: athleteObj.longTeamName,
            expirationTimeMinutes: null,
            fantasyValue: $('#fantasyValue').val(),
            gameId: (typeof(gameId) === 'undefined') ? null : gameId,
            isOverBettor: ($('input[type=\'radio\']:checked')[0]
              .value.toLowerCase() === 'over'),
            sport: athleteObj.sport,
            wager: $('#wagerAmount').val()
          },
          success: function(response) {
            console.log(response.success);
          },
          error: function(xhr, status, err) {
            console.error(xhr, status, err);
          }
        });
      }
      else {
        console.log('cannot submit!');
      }
    });
  })();

  //more event bindings below
  //...

}(typeof exports === 'undefined' ?
    window.events = {} :
    exports));