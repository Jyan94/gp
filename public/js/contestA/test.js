'use strict';

/*global contestARetrieveBets*/
var $container;

$(document).ready(function() {
  setTimeout(function() {
    contestARetrieveBets.getBetByIndex(0);
  }, 1000);
  $container = $('.isotope');
  $container.isotope({
    itemSelector: '.playercard1',
    layoutMode: 'fitRows',
    getSortData: {
      id: '.id'
    }
  });
  contestARetrieveBets.requestGetAndUpdateBets();
});