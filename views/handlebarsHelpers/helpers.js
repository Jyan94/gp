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

exports.contestBEntryHelper = function (context, options) {
  var athletes = context.athletes;
  var ret = "";

  for (var i = 0; i < athletes.length; i++) {
    ret += options.fn({
                        athlete: athletes[i],
                        index: i,
                        maxWager: context.maxWager
                      });
  }

  return ret;
}

exports.contestBEditHelper = function (context, options) {
  var athletes = context.athletes;
  var contestantInstance = context.contestantInstance;
  var ret = "";

  for (var i = 0; i < athletes.length; i++) {
    ret += options.fn({
                        athlete: athletes[i],
                        index: i,
                        prediction: contestantInstance.predictions[i],
                        wager: contestantInstance.wagers[i],
                        maxWager: context.maxWager
                      });
  }

  return ret;
};