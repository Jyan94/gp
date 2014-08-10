$(document).ready(function() {
  $('.game-title-box').click(function (e) {
    var gameBoxId = '#' + $(e.target).closest('.game-box').attr('id');
    var gameBox = $(gameBoxId);
    var gameTeamsBoxHeight = $(gameBoxId + ' > .game-teams-box-container > .game-teams-box').outerHeight();
    var gameTeamsBoxContainer = $(gameBoxId + ' > .game-teams-box-container');

    if (gameBox.hasClass('active')) {
      gameTeamsBoxContainer.css('height', 4);
    }
    else {
      gameTeamsBoxContainer.css('height', gameTeamsBoxHeight);
    }

    gameBox.toggleClass('active');
  });

  var maximumEntriesFiftyFifty = '<input type="number" name="maximum-entries" placeholder="Maximum Entries" min="3" max="2001" required="true" step="2" value ="11" id="maximum-entries">\n';
  var maximumEntriesNormal = '<select name="maximum-entries" id="maximum-entries">\n'
                             + '  <option value="2">2</option>\n'
                             + '  <option value="3">3</option>\n'
                             + '  <option value="5">5</option>\n'
                             + '  <option value="10">10</option>\n'
                             + '  <option value="12">12</option>\n'
                             + '  <option value="14">14</option>\n'
                             + '  <option value="23">23</option>\n'
                             + '  <option value="56">56</option>\n'
                             + '  <option value="112">112</option>\n'
                             + '  <option value="167">167</option>\n'
                             + '  <option value="230">230</option>\n'
                             + '  <option value="1150">1150</option>\n'
                             + '</select>\n'; 

  $(document).on('change', '#is-fifty-fifty', function (e) {
    if ($('#is-fifty-fifty').val() === 'true') {
      $('#maximum-entries').replaceWith(maximumEntriesFiftyFifty);
    }
    else {
      $('#maximum-entries').replaceWith(maximumEntriesNormal);
    }
  });
});