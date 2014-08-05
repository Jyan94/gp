/**
 * ====================================================================
 * Author: Harrison Zhao
 * ====================================================================
 */
'use strict';
/*global contestARetrieveBets*/

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
$('.take-bet-button').click(function() {
  //get the array index of the button, thus getting array index of the card
  var arrayIndex = $(this).attr('clickIndex');
  var bet = contestARetrieveBets.getBetByIndex(arrayIndex);
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