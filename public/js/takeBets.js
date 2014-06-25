$(function() {

  $('.bet').each(function(index, element) {
    $('#'+element.id).click(function(e) {
      e.preventDefault();
      var playerId = $(element).attr('href');
      var betId = element.id.substring(3);
      var data = {betId: betId};
      $.ajax({
        type: 'POST',
        data: JSON.stringify(data),
        contentType: 'application/json',
        url: '../addBets/' + playerId
      });
    });
  });

});