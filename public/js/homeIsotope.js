function debounce(fn, threshold) {
  var timeout;
  return function debounced() {
    if (timeout) {
      clearTimeout(timeout);
    }
    function delayed() {
      fn();
      timeout = null;
    }
    timeout = setTimeout(delayed, threshold || 100);
  }
}

$(function() {

  var qsRegex;
  var $container = $('isotope').isotope({
    itemSelector: 'playercard1.playercard1-playerpic.playercard1-info',
    layoutMode: 'fitRows',
    filter: function() {
      return qsRegex ? $(this).text().match(qsRegex) : true;
    }
  });

  var $quicksearch = $('#quicksearch').keyup(debounce(function() {
    qsRegex = new RegExp( $quicksearch.val(), 'gi');
    $container.isotope();
  }, 200));
});
