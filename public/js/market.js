function marketError(error, id) {
  if ($('.flash-error-fade').is(':animated')) {
    $('.flash-error-fade').stop(true, true);
  }

  var offset = $('#' + id).offset();
  var posX = offset.left + 30;
  var posY = offset.top - 15;

  console.log(posX, posY);

  $('#flash-error-market-' + error).css({ left: posX, top: posY });
  $('#flash-error-market-' + error).show().fadeOut(2000);
}

$(function() {
  $('.bet').each(function(index, element) {
    $('#' + element.id).click(function(e) {
      e.preventDefault();
      var athleteId = $(element).attr('href');
      var betId = element.id.substring(3);
      var data = {betId: betId};
      $.ajax({
        type: 'POST',
        data: JSON.stringify(data),
        contentType: 'application/json',
        url: '../addBets/' + athleteId,
        success: function (response) {
          window.location.href = '/market/' + athleteId
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
  var athleteId = $('#betForm.pure-form')[0].action.substring(33);
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
    url: '../submitForm/' + athleteId,
    success: function (response) {
      window.location.href = '/market/' + athleteId;
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