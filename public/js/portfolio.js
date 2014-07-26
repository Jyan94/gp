/*$(document).on('ready', function(){
    var icons = {
      header: "ui-icon-circle-arrow-e",
      activeHeader: "ui-icon-circle-arrow-s"
    };
    $( "#accordion" ).accordion({
      icons: icons,
      collapsible: true
    });
    $( "#toggle" ).button().click(function() {
      if ( $( "#accordion" ).accordion( "option", "icons" ) ) {
        $( "#accordion" ).accordion( "option", "icons", null );
      } else {
        $( "#accordion" ).accordion( "option", "icons", icons );
      }
    });
});*/

$(document).on('ready', function() {
  var activeTabIndex = -1;
  var tabNames = ['portfolio-tab-1', 'portfolio-tab-2', 'portfolio-tab-3']
  
  $('.portfolio-tab').click(function (event) {
    for (var i = 0; i < tabNames.length; i++) {
      if (event.target.id === tabNames[i]) {
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