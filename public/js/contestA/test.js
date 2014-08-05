'use strict';
/*global contestARetrieveBets*/

$(document).ready(function() {
  var $container;
  setTimeout(function() {
    contestARetrieveBets.getBetByIndex(0);
  }, 1000);
  $container = contestARetrieveBets.setIsotopeContainer($('.isotope'));
  $container.isotope({
    itemSelector: '.playercard1',
    layoutMode: 'fitRows',
    getSortData: {
      id: '.id'
    }
  });
  contestARetrieveBets.requestGetAndUpdateBets();
});