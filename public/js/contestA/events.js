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
  (function () {
    $('.take-bet-button').click(function() {
      //get the array index of the button, thus getting array index of the card
      var arrayIndex = $(this).attr('clickIndex');
      var bet = contestAGetBets.getBetByIndex(arrayIndex);
      $.ajax({
        url: '/takePendingBet',
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
  })();

  //make bet form
  //autocomplete and create bet
  (function () {
    var athleteObj = {};
    var wagerAmount = $('#wagerAmount').val();
    var fantasyValue = $('#fantasyValue').val();
    var overUnder = $('input[type=\'radio\']:checked')[0].value;

    function initAutocomplete() {
      var searchCache = contestALoadAthletesCache.getAthletesArray().map(
        function (athlete) {
          athlete.label = athlete.fullName;
          return athlete;
      });

      if (searchCache.length === 0) {
        setTimeout(function() {
          initAutocomplete();
        }, 1000);
      }
      else {
        $('#autocomplete').autocomplete({
          source: searchCache,
          select: function(e, ui) {
            athleteObj = contestALoadAthletesCache.getAthleteById(ui.item.id);
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
          },
          delay: 500,
          minLength: 3
        }).data('ui-autocomplete')._renderItem = function ( ul, item ) {
            return $('<li>')
              .append('<a><img style="background-image: url(' + item.image + ')">' +
                item.label + '</a>')
              .appendTo(ul);
        };
      }
    }
    initAutocomplete();

    // Hover states on the static widgets
    $('#dialog-link, #icons li').hover(
      function() {
        $( this ).addClass('ui-state-hover');
      },
      function() {
        $( this ).removeClass('ui-state-hover');
      }
    );
    
    $('#betForm').on('input', function(){
      wagerAmount = $('#wagerAmount').val();
      fantasyValue = $('#fantasyValue').val();
        
      var playerString = "$" + wagerAmount + " " + overUnder + " " + fantasyValue + " FP";
      $('.playercard1#create').find('.playercard1-bottom.wager p').replaceWith('<p>' + playerString + '</p');
    });

    $('input[type=\'radio\']').on('change', function() {
      overUnder = $('input[type=\'radio\']:checked')[0].value;
        
      var playerString = "$" + wagerAmount + " " + overUnder + " " + fantasyValue + " FP";
      $('.playercard1#create').find('.playercard1-bottom.wager p').replaceWith('<p>' + playerString + '</p');
    });

    //create bet
    $('#betForm').submit(function(e) {
      e.preventDefault();
      if (athleteObj) {
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
            gameId: null,
            isOverBettor: $('input[type=\'radio\']:checked')[0].value,
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

  }());
  

  //more event bindings below
  //...

}(typeof exports === 'undefined' ? 
    window.events = {} : 
    exports));