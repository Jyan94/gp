$(document).ready(function(){

  $('#paypal').on('click', function (e) {
    console.log(e);
    $('body').toggleClass('dialogIsOpen');
  });

  $('.paypal-dialog-box-backdrop').on('click', function () {
    // State changes
    $('body').toggleClass('dialogIsOpen');
  });
})