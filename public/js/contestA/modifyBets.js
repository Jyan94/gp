/**
 * ====================================================================
 * Author: Harrison Zhao
 * ====================================================================
 */
'use strict';
//include this file first
(function(exports) {

  /**
   * exported object
   * makes the ajax call to take a bet
   * @param  {object} bet
   * a bet object
   */
  function takeBet(bet) {
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
  }

  /**
   * makes an ajax call to create a bet
   * @param  {object} info
   * info has fields:
   *   id
   *   image
   *   name
   *   position
   *   team
   *   expiration
   *   fantasyValue
   *   gameId
   *   isOverBettor
   *   sport
   *   wager
   * @return {[type]}      [description]
   */
  function createBet(info) {
    $.ajax({
      url:'/createBet',
      type: 'POST',
      dataType: 'json',
      data: {
        athleteId: info.id,
        athleteImage: info.image,
        athleteName: info.name,
        athletePosition: info.position,
        athleteTeam: info.team,
        expirationTimeMinutes: info.expiration,
        fantasyValue: info.fantasyValue,
        gameId: info.gameId,
        isOverBettor: info.isOverBettor,
        sport: info.sport,
        wager: info.wager
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

  exports.createBet = createBet;
  exports.takeBet = takeBet;
}(typeof exports === 'undefined' ? 
    window.contestAModifyBets = {} : 
    exports));
/*
  fields in body:
    athleteId,
    athleteName,
    athleteTeam,
    betId,
    fantasyValue,
    opponent,        
    overNotUnder,
    wager*/
/*
$('.take-bet-button').click(function() {
  //get the array index of the button, thus getting array index of the card
  var arrayIndex = $(this).attr('clickIndex');
  var bet = contestAGetBets.getBetByIndex(arrayIndex);

});

$('#betForm').submit(function(e) {
  e.preventDefault();
  var bool = false;
  for (var i = 0; i < searchCache.length; i++) {
    if (id === searchCache[i].id) {
      bool = true;
      break;
    }
  }
  $.ajax({
    url:'/createBet',
    type: 'POST',
    dataType: 'json',
    data: {
      athleteId: id,
      athleteImage: image,
      athleteName: label,
      athletePosition: position,
      athleteTeam: longTeamName,
      expirationTimeMinutes: null,
      fantasyValue: $('#fantasyValue').val(),
      gameId: null,
      isOverBettor: overUnder,
      sport: sport,
      wager: $('#wagerAmount').val(),
    },
    success: function() {
      document.location.href = '/createBet';
    },
    error: function() {
      var color = $('#autocomplete').css('border-color');
      $('#autocomplete').css('border-color', '#cc0704');
      setTimeout(function() {
        $('#autocomplete').css('border-color', color);
      }, 5000);
    }
  })
})*/