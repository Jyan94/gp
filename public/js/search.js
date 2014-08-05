$(function() {
  var searchCache = [];
  var id;
  var longTeamName;
  var label;
  var image;
  var position;
  var sport;
  $.getJSON("/autocomp", function (data) {
    data = data.map(function(element) {
      element.label = element.fullName;
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
      image = ui.item.image;
      sport = ui.item.sport;
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
    }
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

  var overUnder;
  if (document.getElementById('radioFormA').checked) {
    overUnder = document.getElementById('radioFormB').value;
  }
  else {
    overUnder = document.getElementById('radioFormA').value;
  }

  $('#betForm').submit(function(e) {
    e.preventDefault();
    var bool = false;
    for (var i = 0; i < searchCache.length; i++) {
      if (id === searchCache[i].id) {
        bool = true;
        break;
      }
    }
    $.ajax({
      url:'/createBet',
      type: 'POST',
      dataType: 'json',
      data: {
        athleteId: id,
        athleteImage: image,
        athleteName: label,
        athletePosition: position,
        athleteTeam: longTeamName,
        expirationTimeMinutes: null,
        fantasyValue: $('#fantasyValue').val(),
        gameId: null,
        isOverBetter: overUnder,
        sport: sport,
        wager: $('#wagerAmount').val(),
      },
      success: function() {
        document.location.href = '/createBet';
      },
      error: function() {
        var color = $('#autocomplete').css('border-color');
        $('#autocomplete').css('border-color', '#cc0704');
        setTimeout(function() {
          $('#autocomplete').css('border-color', color);
        }, 5000);
      }
    })
  })
})