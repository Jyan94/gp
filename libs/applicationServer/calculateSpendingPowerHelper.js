

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
    var player1 = result[i];
    var templong = 0.0;
    var tempshort = 0.0;
    for (var j = i+1; j < result.length; j++) {
      var player2 = result[j];
      // if user has other positions of the same player, check to see if
      // the position has already been taken into account
      // if position has already been taken into account,
      // playerCheckedArr.indexOf(i) != -1
      if (playerCheckedArr.indexOf(i) === -1 && player1.player_id === player2.player_id) {
        //Since pending_bets and current_bets have a different structure in
        //database, we have to take care of them separately.  If player2.user_id
        //is undefined, the bet is in the current bets table
        if (player2.user_id === undefined) {
          if (player2.long_better_id === userId) {
            templong = templong + player2.bet_value * player2.multiplier;
          }
          else {
            tempshort = tempshort = player2.bet_value * player2.multiplier;
          }
        }
        else {
          //in pending_bets table
          if (player2.long_position === true) {
            templong = templong + player2.bet_value * player2.multiplier;
          }
          else {
            tempshort = tempshort = player2.bet_value * player2.multiplier;
          }
        }
        //push to array so we know we already checked this player
        playerCheckedArr.push(j);
      }
    }
    // repeat procedure for the initial player i
    if (playerCheckedArr.indexOf(i) === -1) {
      if (player1.user_id === undefined) {
        if (player1.long_better_id === userId) {
          templong = templong + player1.bet_value * player1.multiplier;
        }
        else {
          tempshort = tempshort + player1.bet_value * player1.multiplier;
        }
      }
      else {
        if (player1.long_position === true) {
          templong = templong + player1.bet_value * player1.multiplier;
        }
        else {
          tempshort = tempshort = player1.bet_value * player1.multiplier;
        }
      }
    }
    //console.log("templong: " + templong);
    //console.log("tempshort: " + tempshort);
    increase = increase + tempshort - templong;
  }
  var spendingPower = money + increase;
  //console.log(spendingPower);
  callback(null, spendingPower);
}