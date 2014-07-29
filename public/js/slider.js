$(document).ready(function() {
  $(function() {
    $( "#slider-range" ).slider({
      range: true,
      min: 0,
      max: 10000,
      values: [ 50, 300 ],
      step: 50,
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
      values: [ 0, 20 ],
      step: 0.1,
      slide: function( event, ui ) {
        $( "#amount2" ).val( + ui.values[ 0 ] + " - " + ui.values[ 1 ] );
      }
    });
    $( "#amount2" ).val( + $( "#slider-range2" ).slider( "values", 0 ) +
      " - " + $( "#slider-range2" ).slider( "values", 1 ) );
  });
    $(".btn1").click(function(){
    $("#filter").toggle();
    $("#filter2").toggle();
    $("#slider-range").toggle();
    $("#slider-range2").toggle();
  });
});