'use strict';
/*global contestAGetBets*/

$(document).ready(function() {
  var $container;
  setTimeout(function() {
    contestAGetBets.getBetByIndex(0);
  }, 1000);
  $container = contestAGetBets.setIsotopeContainer($('.isotope'));
  $container.isotope({
    itemSelector: '.playercard1',
    layoutMode: 'fitRows',
    getSortData: {
      id: '.id'
    }
  });
  contestAGetBets.requestGetAndUpdateBets();
});