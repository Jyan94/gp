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
/* global contestALoadAthletesCache*/
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
    athleteId,
    fullName,  
    fullTeamName,
    overNotUnder,
    pictureUrl,
    athletePosition,
    wager,
    sport) {

    var athlete = contestALoadAthletesCache.getAthleteById(athleteId);

    var betPosition;
    if (overNotUnder) {
      betPosition = 'over';
    }
    else {
      betPosition = 'under';
    }
    /*jshint ignore:start*/
    var retval = $(
      '<div id=\'playercard1-' + arrayId + '\' class=\'playercard1 ' + sport + '\'>' +
        '<div class=\'id\' style=\'display: none;\'>' + arrayId + '</div>' +
        '<div class=\'playercard1-front\'>' +
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
                  '<p>' + athletePosition + '&#160;|&#160;' + fullTeamName +'</p>' +
                '</center>' +
              '</div>' +
            '</div>' +
            '<div class=\'playercard1-bottom\'>' +
              '<div class=\'playercard1-bottom wager\'><p>$' + wager + ' '  + betPosition + ' ' + fantasyValue + ' FP</p></div>' +
              '<div class=\'playercard1-bottom submit\'>' +
                '<center>' +
                  '<div clickIndex=' + 
                  arrayId + 
                  ' class=\'pure-button button-primary take-bet-button\'>Take</div>' +
                '</center>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class=\'playercard1-back\'>' +
          '<div class="playercard1-back-info">' +
         ' </div>' +
          '<div class=\'playercard1-back-tab-container\'>' + 
            '<ul class=\'playercard1-back-tab-menu\'>' +
              '<li id=\'playercard1-' + arrayId + '-tab-1\' class=\'playercard1-back-tab active\'>' +
                'Tab 1' +
              '</li>' +
              '<li id=\'playercard1-' + arrayId + '-tab-2\' class=\'playercard1-back-tab\'>' +
                'Tab 2' +
              '</li>' +
              '<li id=\'playercard1-' + arrayId + '-tab-3\' class=\'playercard1-back-tab\'>' +
                'Tab 3' +
              '</li>' +
            '</ul>' +
            '<div class=\'playercard1-back-tab-border\'>' +
            '</div>' +
            '<div id=\'playercard1-' + arrayId + '-tab-1-content\' class=\'playercard1-back-tab-content active\'>' +
              '<div id=\'playercard1-' + arrayId + '-graph-container\' class=\'graph-container\'></div>' +
            '</div>' +
            '<div id=\'playercard1-' + arrayId + '-tab-2-content\' class=\'playercard1-back-tab-content\'>' +
              '<p>Stuff 2</p>' +
              '<p>Stuff 2</p>' +
            '</div>' +
            '<div id=\'playercard1-' + arrayId + '-tab-3-content\' class=\'playercard1-back-tab-content\'>' +
              '<p>Stuff 3</p>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>');
    return retval;
    /*jshint ignore:end*/
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
        bet.athleteId,
        bet.athleteName,
        bet.athleteTeam,
        bet.overNotUnder,
        bet.athleteImage,
        bet.athletePosition,
        bet.price,
        bet.sport);
    }
    else {
      card = '<div id=\'playercard1-' + 
        index + 
        '\' class=\'playercard1\' style=\'display: none;\'>';
    }
    return card;
  }

  //export createCard function
  exports.createCard = createCard;

}(typeof exports === 'undefined' ? 
    window.contestACreateAthleteCard = {} : 
    exports));