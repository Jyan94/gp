/**
 * ====================================================================
 * Author: Harrison Zhao
 * ====================================================================
 */
'use strict';

$(function() {
  var SHOW_MILLISECONDS = 2000;
  var FADE_MILLISECONDS = 200;
  var loginUrl = '/login';

  function showErrorMessage(message) {
    $('#error-message-span')
      .text(message)
      .fadeIn(FADE_MILLISECONDS)
      .delay(SHOW_MILLISECONDS)
      .fadeOut(FADE_MILLISECONDS);
  }

  $('#login-form').submit(function(event) {
    event.preventDefault();
    var $inputs = $('#login-form input');
    var formData = {};
    for (var i = 0; i !== $inputs.length; ++i) {
      formData[$inputs[i].id] = $inputs[i].value;
    }
    $.ajax({
        url: loginUrl,
        type: 'POST',
        data: formData,
        success: function(data) {
          if (!data.message) {
            window.location.href = document.URL;
          }
          else {
            console.log(data);
          }
        },
        error: function(xhr, status, err) {
          console.error(xhr, status, err);
        }
      });
  });

  //bind enter button to submit button
  $(document).keypress(function(event){
    if (event.which === 13){
      $("#submit-login").click();
    }
  });
});

