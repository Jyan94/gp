/*global async*/
$(document).ready(function() {
  var allBets = [];
  var displayedBets = [];
  var betIdToIndex = {};
  var POLL_INTERVAL = 2000;

  function customSetInterval(func, interval) {
    var callback = function (err) {
      if (err) {
        console.log(err);
      }
      setTimeout(function () {
        customSetInterval(func, interval);
      }, interval);
    };
    func(callback);
  }

  /**
   * data
   * @param  {object} data
   * data from the server for bets and hashmap of betId to array index
   */
  function updateBets(data) {
    allBets = data.bets;
  }

  function requestGetAndUpdateBets(callback) {
    $.ajax({
      url: 'getbets',
      dataType: 'json',
      success: function(data) {
        updateBets(data, function(err) {
          if (err) {
            callback(err);
          }
          else {
            callback(null);
          }
        });
      },
      error: function(xhr, status, err) {
        console.error(xhr, status, err);
      }
    });
  }

  customSetInterval(requestGetAndUpdateBets, POLL_INTERVAL);
});