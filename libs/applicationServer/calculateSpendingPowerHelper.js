/*Basically adds up all the long positions and short positions for a specific
athlete from a user */
exports.calculate = function(result, userId, money, callback) {
  var increase = 0.0;
  var playerCheckedArr = [];
  for (var i = 0; i < result.length; i++) {
    var player1 = result[i];
    var templong = 0.0;
    var tempshort = 0.0;
    for (var j = i+1; j < result.length; j++) {
      var player2 = result[j];
      if (playerCheckedArr.indexOf(i) === -1 && player1.player_id === player2.player_id) {
        if (player2.user_id === undefined) {
          if (player2.long_better_id === userId) {
            templong = templong + player2.bet_value * player2.multiplier;
          }
          else {
            tempshort = tempshort = player2.bet_value * player2.multiplier;
          }
        }
        else {
          if (player2.long_position === true) {
            templong = templong + player2.bet_value * player2.multiplier;
          }
          else {
            tempshort = tempshort = player2.bet_value * player2.multiplier;
          }
        }
        playerCheckedArr.push(j);
      }
    }
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