$(window).load(function(){
$(document).ready(function() {

  $("#filters").hide();
  $("#filters1").hide();
  $("#filterdiv").hide();
  $(function() {
    $( "#slider-range" ).slider({
      range: true,
      min: 1,
      max: 100,
      values: [ 1, 100 ],
      step: 1,
      slide: function( event, ui ) {
        $( "#amount" ).val( "$" + ui.values[ 0 ] + " - $" + ui.values[ 1 ] );
      }
    });
    $( "#amount" ).val( "$" + $( "#slider-range" ).slider( "values", 0 ) +
      " - $" + $( "#slider-range" ).slider( "values", 1 ) );
    $( "#slider-range2" ).slider({
      range: true,
      min: 0,
      max: 50,
      values: [ 0, 50 ],
      step: 0.1,
      slide: function( event, ui ) {
        $( "#amount2" ).val( + ui.values[ 0 ] + " - " + ui.values[ 1 ] );
      }
    });
    $( "#amount2" ).val( + $( "#slider-range2" ).slider( "values", 0 ) +
      " - " + $( "#slider-range2" ).slider( "values", 1 ) );
  });


    $(".btn1").click(function(){
    $("#filters").toggle();
    $("#filters1").toggle();
    $("#filterdiv").toggle();
  });
});
});