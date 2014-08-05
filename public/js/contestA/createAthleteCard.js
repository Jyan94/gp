/*
 * =============================================================================
 * Author: Harrison Zhao
 * Date: 8/1/2014
 * Documentation:
 *
 * exports: contestACreateAthleteCard object
 * has methods:
 *   *createCard
 *     -see documentation below above the method
 * =============================================================================
 */
'use strict';
/**
 * returns an athlete card
 * @param  {int} arrayId 
 * @param  {double} fantasyValue
 * @param  {string} fullName
 * @param  {string} fullTeamName
 * @param  {boolean} overNotUnder
 * @param  {string} pictureUrl
 * @param  {string} athletePosition
 * @param  {double} wager
 */
(function(exports)  {

  function createAthleteCard(
    arrayId,
    fantasyValue,
    fullName,  
    fullTeamName,
    overNotUnder,
    pictureUrl,
    athletePosition,
    wager) {

    var betPosition;
    if (overNotUnder) {
      betPosition = 'over';
    }
    else {
      betPosition = 'under';
    }
    var retval = $(
      '<div id=' + arrayId + ' class=\'playercard1\'>' +
      '<div class="id" style="display:">' + arrayId + '</div>' +
      '<div class=\'playercard1-playerpic\'>' + 
      '<img width=\'250\' height=\'250\' src=\'' + pictureUrl + '\'>' +

      '<div class=\'playercard1-info\'>' +

        '<div class=\'playercard1-info name\'>' +
        '<center>' +
        '<p>' + fullName + '</p>' +
        '</center>' +
        '</div>' +

        '<div class=\'playercard1-info pos\'>' +
        '<center>' +
        '<p>' + athletePosition + '|' + fullName +'</p>' +
        '</center>' +
        '</div>' +

      '</div>' +

      '<div class=\'playercard1-bottom\'>' +

        '<div class=\'playercard1-bottom wager\'>' +
        '<p> $' + wager + " " + betPosition + " " + fantasyValue + "FP</p>" +
        '</div>' +

        '<div class=\'playercard1-bottom submit\'>' +
          '<center>' +
          '<div clickIndex=' + 
          arrayId + 
          ' class=\'pure-button button-primary take-bet-button\'>Take</div>' +
          '</center>' +
        '</div>' +

      '</div>' +

      '</div>' +
      '</div>');
    return retval;
  }

  /**
   * creates a card from a bet
   * @param  {int} index
   * index of bet in rendered bet array
   * @param  {object} bet
   * must have fields:
   * fantasyValue, athleteName, athleteTeam, overNotUnder,
   * athleteImage, athletePosition, and price
   * @return {string} HTML string for the bet
   */
  function createCard(index, bet) {
    var div = $('#' + index);
    var card;
    if (bet) {
      card = createAthleteCard(
        index,
        bet.fantasyValue,
        bet.athleteName,
        bet.athleteTeam,
        bet.overNotUnder,
        bet.athleteImage,
        bet.athletePosition,
        bet.price);
    }
    else {
      card = '<div id=' + index + ' style="display: none;">'
    }
    return card;
  }

  //export createCard function
  exports.createCard = createCard;

}(typeof exports === 'undefined' ? 
    window.contestACreateAthleteCard = {} : 
    exports));