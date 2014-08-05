/*
 * =============================================================================
 * Author: Harrison Zhao
 * Date: 8/5/2014
 * =============================================================================
 */

/*global contestALoadAthletesCache*/
/*global contestAGetBets*/
'use strict';

(function(exports)  {
  //take bet
  $('.take-bet-button').click(function() {
    //get the array index of the button, thus getting array index of the card
    var arrayIndex = $(this).attr('clickIndex');
    var bet = contestAGetBets.getBetByIndex(arrayIndex);
    $.ajax({
      url: '/takeBet',
      type: 'POST',
      dataType: 'json',
      data: {
        athleteId: bet.athleteId,
        athleteName: bet.athleteName,
        athleteTeam: bet.athleteTeam,
        betId: bet.betId,
        fantasyValue: bet.fantasyValue,
        opponent: bet.opponent,
        overNotUnder: bet.overNotUnder,
        wager: bet.wager
      },
      success: function(message) {
        //preferably show a message for 2 seconds
        console.log(message);
      },
      error: function(xhr, status, err) {
        console.error(xhr, status, err);
      }
    });
  });

  //autocomplete and create bet
  (function () {
    //var id;
    var athleteObj;
    var overUnder;
    //TODO: make sure images are pointing to correct path before sent!!!!
    var searchCache;
    var mapFunc = function(athlete) {
      athlete.label = athlete.fullName;
      return athlete;
    };

    function initSearchCache() {
      searchCache = contestALoadAthletesCache.getAthletesArray().map(mapFunc);
      console.log(searchCache);
      if (searchCache.length === 0) {
        setTimeout(function() {
          initSearchCache();
        }, 1000);
      }
    }
    initSearchCache();
    /*$('#autocomplete').on('input', function () {
      id = undefined;
    });*/

    $('#autocomplete').autocomplete({
      source: searchCache,
      select: function(e, ui) {
        athleteObj = contestALoadAthletesCache.getAthleteById(ui.item.id);
      },
      change: function(e, ui) {
        //athleteObj = contestALoadAthletesCache.getAthleteById(id);
        if (athleteObj) {
          $('.playercard1#create')
            .find('.playercard1-info.name p')
            .replaceWith('<p>' + athleteObj.fullName + '</p');
          $('.playercard1#create')
            .find('.playercard1-info.pos p')
            .replaceWith('<p>' + athleteObj.position + ' | ' + 
              athleteObj.longTeamName + '</p');
          $('.playercard1#create')
            .find('.playercard1-playerpic img')
            .replaceWith('<img src=\'' + athleteObj.image +
             '\'' + 'width=\'250\' height=\'250\'>');
        }
      }
    }).data('ui-autocomplete')._renderItem = function ( ul, item ) {
      return $('<li>')
        .append('<a><img style="background-image: url(' + item.image + ')">' +
          item.label + '</a>')
        .appendTo(ul);
    };

    // Hover states on the static widgets
    $('#dialog-link, #icons li').hover(
      function() {
        $( this ).addClass('ui-state-hover');
      },
      function() {
        $( this ).removeClass('ui-state-hover');
      }
    );

    if (document.getElementById('radioFormA').checked) {
      overUnder = document.getElementById('radioFormB').value;
    }
    else {
      overUnder = document.getElementById('radioFormA').value;
    }

    //create bet
    $('#betForm').submit(function(e) {
      e.preventDefault();
      if (athleteObj) {
        $.ajax({
          url:'/createBet',
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
            gameId: null,
            isOverBettor: overUnder,
            sport: athleteObj.sport, 
            wager: $('#wagerAmount').val()
          },
          success: function(message) {
            console.log(message);
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

  }());
  
  //more event bindings below
  //...

}(typeof exports === 'undefined' ? 
    window.events = {} : 
    exports));