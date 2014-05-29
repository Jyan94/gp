$('bet').each(function(index, element) {
  $('#'+element.id).click(function(e) {
    e.preventDefault();
    var url = $(element).attr('href');
    var data = {bet_id: bet_id};
    $.ajax({
      type: 'POST',
      data: JSON.stringify(data),
      contentType: 'application/json',
      url: 'http://localhost:3000/addBets'
    });
  });
});