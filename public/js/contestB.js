// Something happens
// ;
/*$('#contestTable').on('click', function (e) {
  console.log(e);

  if (e.target.className === 'enterbtn') {
    return true;
  }
  else if (e.target.localName === 'td') {
    console.log(e.target.localName);
    // State changes
    $('body').toggleClass('dialogIsOpen');
  }
});*/

// Something happens
/*$('.contest-dialog-box-backdrop').on('click', function () {

  // State changes
  $('body').toggleClass('dialogIsOpen');

});*/

/*$(document).ready(function () {
  var activeTabIndex = -1;
  var tabNames = ['tab1', 'tab2', 'tab3']

  $('.contest-dialog-box-tab').click(function (e) {
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
});*/