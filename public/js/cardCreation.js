$(function() {

  function displayVals () {
    var wager = $('#wagerAmount').val();
    var fantasyValue = $('#fantasyValue').val();

    var overUnder;
    if (document.getElementById('radioFormA').checked) {
      overUnder = document.getElementById('radioFormB').value;
    }
    else {
      overUnder = document.getElementById('radioFormA').value;
    }

    console.log(overUnder);

    var playerString = "$" + wager + " " + overUnder + " " + fantasyValue + " FP";
    console.log(playerString);
    //$('.playercard1-bottom.wager').innerHtml('<p>' + playerString + '</p>');
    $('.playercard1#create').find('.playercard1-bottom.wager p').replaceWith('<p>' + playerString + '</p');
    //$(innerWager).replaceWith('<p>' + playerString + '</p>');
  }

  $('#betForm').on('change', function(){
    displayVals();
  });
});