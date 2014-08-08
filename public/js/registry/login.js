/**
 * ====================================================================
 * Author: Harrison Zhao
 * ====================================================================
 */
'use strict';

$(function() {
  var SHOW_MILLISECONDS = 2000;
  var FADE_MILLISECONDS = 200;

  function showErrorMessage(message) {
    $('#error-message-span')
      .text(message)
      .fadeIn(FADE_MILLISECONDS)
      .delay(SHOW_MILLISECONDS)
      .fadeOut(FADE_MILLISECONDS);
  }

  $('#login-form').submit(function(event) {
    event.preventDefault();
    var $inputs = $('#signup-form :input');
    console.log($inputs);
  });
});

