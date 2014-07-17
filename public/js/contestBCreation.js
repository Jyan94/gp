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
})