function changeAsync () {
  var data = new FormData($('#prof-upload')[0]);
  console.log(data);
  $.ajax({
    url: $('#prof-upload').attr('action'),
    type: 'POST',
    data: data,
    processData: false,
    contentType: false,
    success: function (response) {
      console.log(response);
      $('#prof-pic').css('background-image', 'url(' + response + ')');
    },
    failure: function (response) {
      console.log(response);
    }
  });
}

$(document).ready(function () {
  var activeTabIndex = -1;
  var tabNames = ['pending-bets', 'current-bets', 'past-bets']

  $('.tab-menu > li').click(function (e) {
    for (var i =0; i < tabNames.length; i++) {
      if (e.target.id === tabNames[i]) {
        activeTabIndex = i;
      }
      else {
        $('#' + tabNames[i]).removeClass('active');
        $('#' + tabNames[i] + '-tab').css('display', 'none');
      }
    }

    $('#' + tabNames[activeTabIndex] + '-tab').fadeIn();
    $('#' + tabNames[activeTabIndex]).addClass('active');

    return false;
  });
});

function profileError(error, id) {
  if ($('.flash-error-fade').is(':animated')) {
    $('.flash-error-fade').stop(true, true);
  }

  var offset = $('#' + id).offset();
  var posX = offset.left + 30;
  var posY = offset.top - 15;

  console.log(posX, posY);

  $('#flash-error-profile-' + error).css({ left: posX, top: posY });
  $('#flash-error-profile-' + error).show().fadeOut(2000);
}

$(document).ready(function() {
  $('.delete-bet').each(function(index, element) {
    $('#' + element.id).click(function(e) {
      e.preventDefault();
      var betId = element.id.substring(11);
      var data = { betId: betId } ;
      $.ajax({
        type: 'POST',
        data: JSON.stringify(data),
        contentType: 'application/json',
        url: '../deleteBets/' + betId,
        success: function (response) {
          console.log(response);
          $('#bet-' + betId).remove();
        },
        error: function (response) {
          var parsedResponse = JSON.parse(response.responseText);
          var error = parsedResponse.error;
          var possibleErrors = [4, 5];

          if (possibleErrors.indexOf(error) >= 0) {
            profileError(error, element.id);
          }
        }
      });
    });
  });

});