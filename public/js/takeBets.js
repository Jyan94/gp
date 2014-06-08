$(function() {

  $('.bet').each(function(index, element) {
    $('#'+element.id).click(function(e) {
      e.preventDefault();
      var player_id = $(element).attr('href');
      var bet_id = element.id.substring(3);
      var data = {bet_id: bet_id};
      $.ajax({
        type: 'POST',
        data: JSON.stringify(data),
        contentType: 'application/json',
        url: '../addBets/' + player_id
      });
    });
  });

});