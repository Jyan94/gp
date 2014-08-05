$(function() {
  var searchCache = [];
  var id;
  var longTeamName;
  var label;
  var image;
  var position;
  $.getJSON("/autocomp", function (data) {
    data = data.map(function(element) {
      element.label = element.fullName;
      element.image = '/assets/GPbaseball/' + element.id;
      return element;
    })
    for (var i = 0; i < data.length; i++) {
      searchCache.push(data[i]);
    }
  });

  $('#autocomplete').on('input', function () {
    id = undefined;
  });

  $('#autocomplete').autocomplete({
    source: searchCache,
    select: function(e, ui) {
      label = ui.item.label;
      id = ui.item.id;
      position = ui.item.position;
      longTeamName = ui.item.longTeamName;
      image = ui.item.image
    },
    change: function(e, ui) {
      for (var i = 0; i < searchCache.length; i++) {
        if (id === searchCache[i].id) {
          $('.playercard1#create').find('.playercard1-info.name p').replaceWith('<p>' + label + '</p');
          $('.playercard1#create').find('.playercard1-info.pos p').replaceWith('<p>' + position + ' | ' + longTeamName + '</p');
          $('.playercard1#create').find('.playercard1-playerpic img').replaceWith('<img src=\'' + image + '\'' + 'width=\'250\' height=\'250\'>');
          break;
        }
      }
    },
    delay: 500,
    minLength: 3
  }).data('ui-autocomplete')._renderItem = function ( ul, item ) {
      return $('<li>')
        .append('<a><img style="background-image: url(' + item.image + ')">' +
          item.label + '</a>')
        .appendTo(ul);
  };

  // Hover states on the static widgets
  $('#dialog-link, #icons li').hover(
    function() {
      $( this ).addClass('ui-state-hover');
    },
    function() {
      $( this ).removeClass('ui-state-hover');
    }
  );

  $('#betForm').submit(function(e) {
    e.preventDefault();
    if (typeof id === 'undefined') {
      for (var i = 0; i < searchCache.length; i++) {
        console.log(searchCache[i].label);
        console.log($('#autocomplete').val());
        console.log('test');
        if (searchCache[i].label === $('#autocomplete').val()) {
          id = searchCache[i].id;
          break;
        }
      }
    }
    $.ajax({
      type: 'HEAD',
      url: '/market/' + id,
      success: function() {
        //change this
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