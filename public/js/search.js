$(function() {
  var searchCache = [];
  var id;
  $.getJSON("/autocomp", function (data) {
    for (var i = 0; i < data.length; i++) {
      searchCache.push(data[i]);
    }
  });
  $('#autocomplete').on('input', function () {
    id = undefined;
  });

  $('#autocomplete').autocomplete({
    minLength : 3,
    source: searchCache,
    select: function(e, ui) {
      id = ui.item.athleteId;
    }
  })

  /* .data('ui-autocomplete')._renderItem = function ( ul, item ) {
      console.log(item.image);
      return $('<li>')
        .append('<a><img style="background-image: url(' + item.image + ')">' +
          item.label + '</a>')
        .appendTo(ul);
    };
*/

  // Hover states on the static widgets
  $('#dialog-link, #icons li').hover(
    function() {
      $( this ).addClass('ui-state-hover');
    },
    function() {
      $( this ).removeClass('ui-state-hover');
    }
  );

  $('#searchform').submit(function(e) {
    e.preventDefault();
    if (typeof id === 'undefined') {
      for (var i = 0; i < searchCache.length; i++) {
        console.log(searchCache[i].label);
        console.log($('#autocomplete').val());
        console.log('test');
        if (searchCache[i].label === $('#autocomplete').val()) {
          id = searchCache[i].user_id;
          break;
        }
      }
    }
    $.ajax({
      type: 'HEAD',
      url: '/market/' + id,
      success: function() {
        document.location.href = '/market/' + id;
      },
      error: function() {
        var color = $('#autocomplete').css('border-color');
        $('#autocomplete').css('border-color', '#cc0704');
        setTimeout(function() {
          $('#autocomplete').css('border-color', color);
        }, 2000);
      }
    });
  });
});