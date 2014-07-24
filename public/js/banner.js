$(document).ready(function() {
	var dropDownMenuActive = false;

	$('.fui-list').click(function (e) {
		if (dropDownMenuActive) {
			dropDownMenuActive = false;
      $('.dropdown-menu').removeClass('active');
		}
    else {
      dropDownMenuActive = true;
      $('.dropdown-menu').addClass('active');
    }

    return false;
	});
});