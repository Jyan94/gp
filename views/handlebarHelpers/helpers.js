/*
  file containing handlebars helpers
  exports.[helper name] = function(context, options) {
    //helper stuff here
  }
 */

exports.contestBCreationHelperAway = function (context, options) {
  var shortAwayName = context.shortAwayName;
  var players = context.players;
  var ret = "";

  for (var i = 0; i < players.length; i++) {
    if (players[i].shortTeamName === shortAwayName) {
      ret += options.fn({
                          gameId: context.gameId,
                          player: players[i]
                        });
    }
  }

  return ret;
};

exports.contestBCreationHelperHome = function (context, options) {
  var shortHomeName = context.shortHomeName;
  var players = context.players;
  var ret = "";

  for (var i = 0; i < players.length; i++) {
    if (players[i].shortTeamName === shortHomeName) {
      ret += options.fn({
                          gameId: context.gameId,
                          player: players[i]
                        });
    }
  }

  return ret;
};