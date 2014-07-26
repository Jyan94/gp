function entryFormInputHandlerMaker (startingVirtualMoney) {
  return function () {
    var wagers = $('.entry-form-input.wager');
    var wager = 0.0;
    var remainingMoney = startingVirtualMoney;

    for (var i = 0; i < wagers.length; i++) {
      wager = (!isNaN(parseFloat(wagers[i].value)) ? parseFloat(wagers[i].value) : 0.0);
      remainingMoney -= wager;
    }

    $('.entry-form-money p').text('Money Remaining: ' + remainingMoney);
  };
}

$(document).ready(function() {
  var startingVirtualMoney = parseFloat($('.entry-form-money').attr('id').substring(17));
  var timer = null;
  var entryFormInputHandler = entryFormInputHandlerMaker(startingVirtualMoney);

  $('.entry-form-input.wager').bind('input', function (e) {
    if (timer) {
      clearTimeout(timer);
    }

    timer = setTimeout(entryFormInputHandler, 500);

    return false;
  });
});