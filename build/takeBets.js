$('bet').each(function(index, element) {
  $('#'+element.id).click(function(e) {
    e.preventDefault();
    console.log('1');
    var bet_id = $(element).attr('href');
    var data = {bet_id: bet_id};
    $.ajax({
      type: 'POST',
      data: JSON.stringify(data),
      contentType: 'application/json',
      url: 'http://localhost:3000/addBets'
    });
  });
});