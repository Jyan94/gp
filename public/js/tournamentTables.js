// Something happens
$('#tournaments tbody tr').on('click', function (e) {
  console.log(e);

  if (e.target.className === 'editbtn') {
    //e.stopPropagation();
  }
  else {
    // State changes
    $('body').toggleClass('dialogIsOpen');
  }
});

/*$('.editbtn').on('click', function () {

});*/


// Something happens
$('.tournament-dialog-box-backdrop').on('click', function () {

  // State changes
  $('body').toggleClass('dialogIsOpen');

});

$(document).ready(function () {
  var activeTabIndex = -1;
  var tabNames = ['tab1', 'tab2', 'tab3']

  $('.tournament-dialog-box-tab').click(function (e) {
    for (var i = 0; i < tabNames.length; i++) {
      if (e.target.id === tabNames[i]) {
        activeTabIndex = i;
      }
      else {
        $('#' + tabNames[i]).removeClass('active');
        $('#' + tabNames[i] + '-content').css('display', 'none');
      }
    }

    $('#' + tabNames[activeTabIndex] + '-content').fadeIn();
    $('#' + tabNames[activeTabIndex]).addClass('active');

    return false;
  });
});