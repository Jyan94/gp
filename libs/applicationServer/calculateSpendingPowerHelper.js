

/*
1. Takes all the positions from a user
2. Finds all the positions (pending and current) that the user has on a
specific athlete
3. Calculates the net total risk-free loss or gain
4. Add/subtract that from the total spending power
5. Repeat for all athletes that user owns
*/

exports.calculate = function(result, userId, money, callback) {
  // increase is net gain/loss of spending power in comparison with user's money
  var increase = 0.0;
  // array to check if a position has already been taken into account
  var playerCheckedArr = [];

  // two for-loops to see if the user has other positions of the same player
  for (var i = 0; i < result.length; i++) {
    var longBetSpending = [];
    var shortBetSpending =[];
    
    // if position has already been taken into account,
    // playerCheckedArr.indexOf(i) != -1
    if (playerCheckedArr.indexOf(i) === -1) {
      var playerId = result[i].player_id;

      for (var j = i; j < result.length; j++) {
        var bet = result[j];
        var betSpending = bet.bet_value * bet.multiplier;

        // if user has other positions of the same player, check to see if
        // the position has already been taken into account
        if (playerId === bet.player_id) {

          //Since pending_bets and current_bets have a different structure in
          //database, we have to take care of them separately.  If player2.user_id
          //is undefined, the bet is in the current bets table
          if (bet.user_id === undefined) {
            if (bet.long_better_id === userId) {
              longBetSpending.push(betSpending);
            }
            else {
              shortBetSpending.push(betSpending);
            }
          }
          else {
            //in pending_bets table
            if (bet.long_position === true) {
              longBetSpending.push(betSpending);
            }
            else {
              shortBetSpending.push(betSpending);
            }
          }

          //push to array so we know we already checked this player
          playerCheckedArr.push(j);
        }
      }
    }

    if (longBetSpending.length >= shortBetSpending.length) {
      for (var k = 0; k < shortBetSpending.length; k++) {
        increase += shortBetSpending[k] - longBetSpending[k];
      }

      for (k = shortBetSpending.length; k < longBetSpending.length; k++) {
        increase -= longBetSpending[k];
      }
    }
    else {
      for (var k = 0; k < longBetSpending.length; k++) {
        increase += shortBetSpending[k] - longBetSpending[k];
      }

      for (k = longBetSpending.length; k < shortBetSpending.length; k++) {
        increase -= shortBetSpending[k];
      }
    }
  }
  
  var spendingPower = money + increase;
  //console.log(spendingPower);
  callback(null, spendingPower);
}