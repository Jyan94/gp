// Something happens
$('.editbtn').on('click', function() {

  // State changes
  $('body').toggleClass('dialogIsOpen');

});

// Something happens
$('.tournament-dialog-box-backdrop').on('click', function() {

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