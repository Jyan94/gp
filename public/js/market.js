function marketError(error, id) {
  if ($('.flash-error-market').is(':animated')) {
    $('.flash-error-market').stop(true, true);
  }

  $('#flash-error-market-' + error).css($('#' + id).offset());
  $('#flash-error-market-' + error).show().fadeOut(2000);
}

$(function() {
  $('.bet').each(function(index, element) {
    $('#' + element.id).click(function(e) {
      e.preventDefault();
      var playerId = $(element).attr('href');
      var betId = element.id.substring(3);
      var data = {betId: betId};
      $.ajax({
        type: 'POST',
        data: JSON.stringify(data),
        contentType: 'application/json',
        url: '../addBets/' + playerId,
        success: function (response) {
          window.location.href = '/market/' + playerId
        },
        error: function (response) {
          var parsedResponse = JSON.parse(response.responseText);
          var error = parsedResponse.error;
          var possibleErrors = [3, 4, 5, 6];

          if (possibleErrors.indexOf(error) >= 0) {
            marketError(error, element.id);
          }
        }
      });
    });
  });
});

$('#betForm').submit(function(e) {
  e.preventDefault();
  var playerId = $('#betForm.pure-form')[0].action.substring(33);
  var inputs = $('#betForm input');
  var values = {};
  inputs.each(function() {
    if (this.name === 'longOrShort') {
      if (this.checked) {
        values[this.name] = $(this).val();
      }
    }
    else {
      values[this.name] = $(this).val();
    }
  });
  delete values[''];

  $.ajax({
    type: 'POST',
    data: JSON.stringify(values),
    contentType: 'application/json',
    url: '../submitForm/' + playerId,
    success: function (response) {
      //window.location.href = '/market/' + playerId;
    },
    error: function (response) {
      var parsedResponse = JSON.parse(response.responseText);
      var error = parsedResponse.error;
      var possibleErrors = [3, 4, 5, 6];

      if (possibleErrors.indexOf(error) >= 0) {
        marketError(error, 'betFormButton');
      }
    }
  });
});


// Need to either redirect only once by using javascript and no jquery / ajax,
// or use react.