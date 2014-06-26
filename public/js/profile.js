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
        failure: function (response) {
          console.log(response);
        },
        error: function (response) {
          console.log(response);
        }
      });
    });
  });

});