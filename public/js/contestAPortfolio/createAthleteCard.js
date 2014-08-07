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
    fantasyValue,
    fullName,  
    fullTeamName,
    overNotUnder,
    pictureUrl,
    athletePosition,
    price,
    sport) {

    var betPosition;
    if (overNotUnder) {
      betPosition = 'over';
    }
    else {
      betPosition = 'under';
    }
    /*jshint ignore:start*/
    var retval = $(
      '<div class=\'playercard1 ' + sport + '\'>' +
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
                  '<p>' + athletePosition + '&#160;|&#160;' + fullName +'</p>' +
                '</center>' +
              '</div>' +
            '</div>' +
            '<div class=\'playercard1-bottom\'>' +
              '<div class=\'playercard1-bottom wager\'><p>$' + price + ' '  + betPosition + ' ' + fantasyValue + ' FP</p></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class=\'playercard1-back\'>' +
          '<div class="playercard1-back-info">' +
         ' </div>' +
          '<div class=\'playercard1-back-tab-container\'>' + 
            '<ul class=\'playercard1-back-tab-menu\'>' +
              '<li class=\'playercard1-back-tab active\'>' +
                'Tab 1' +
              '</li>' +
              '<li class=\'playercard1-back-tab\'>' +
                'Tab 2' +
              '</li>' +
              '<li class=\'playercard1-back-tab\'>' +
                'Tab 3' +
              '</li>' +
            '</ul>' +
            '<div class=\'playercard1-back-tab-border\'>' +
            '</div>' +
            '<div class=\'playercard1-back-tab-content active\'>' +
              '<p>Stuff 1</p>' +
              '<br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br>' +
              '<p>Stuff 1</p>' +
            '</div>' +
            '<div class=\'playercard1-back-tab-content\'>' +
              '<p>Stuff 2</p>' +
              '<p>Stuff 2</p>' +
            '</div>' +
            '<div class=\'playercard1-back-tab-content\'>' +
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
  function createCard(bet) {
    var card = createAthleteCard(
      bet.fantasyValue,
      bet.athleteName,
      bet.athleteTeam,
      bet.overNotUnder,
      bet.athleteImage,
      bet.athletePosition,
      bet.price,
      bet.sport);
    return card;
  }

  //export createCard function
  exports.createCard = createCard;

}(typeof exports === 'undefined' ? 
    window.portfolioCreateAthleteCard = {} : 
    exports));