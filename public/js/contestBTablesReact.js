/** @jsx React.DOM */
/* jshint ignore:start */

var formatTime = function (oldTime) {
  var time = new Date(oldTime);
  var timeHalf = (time.getHours() > 11 ? ' PM' : ' AM');
  var timeString = (((time.getHours() + 11) % 12) + 1
                    + time.toTimeString().substring(2, 8)
                    + timeHalf);

  return timeString;
}

/*
 * ====================================================================
 * CONTEST TABLES
 * ====================================================================
 */

var ContestTable = React.createClass({
  loadContestsFromServer: function() {
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      success: function(data) {
        this.setState({data: data});
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },
  getInitialState: function() {
    return {data: []};
  },
  componentWillMount: function() {
    this.loadContestsFromServer();
    setInterval(this.loadContestsFromServer, this.props.pollInterval);
  },
  render: function() {
    return (
      <table id='contests' align='center' style={{margin:'auto', width: 1000}}>
        <thead>
          <tr>
            <th>Sport</th>
            <th>Event</th>
            <th>Game Type</th>
            <th>Start Time (ET)</th>
            <th>Entrants</th>
            <th>Entry Fee</th>
            <th>Prize Pool</th>
            <th>Starting Money</th>
            <th>Enter</th>
          </tr>
        </thead>

        <ContestRows data={this.state.data} />

      </table>
    );
  }
});

var ContestRows = React.createClass({
  render: function() {
    var contestNodes = this.props.data.map(function(contest, index) {
      return (
        <ContestRow data={contest} />
      );
    });
    return (
      <tbody className='contestRows'>
        {contestNodes}
      </tbody>
    );
  }
});

var ContestRow = React.createClass({
  handleClick: function(event) {
    if (event.target.className === 'enterbtn') {
      return true;
    }
    else {
      // State changes
      React.renderComponent(
        <ContestDialogBox data={this.props.data}/>,
        document.getElementById('contest-dialog-box-wrapper')
      );
      $('body').toggleClass('dialogIsOpen');
    }
  },
  render: function() {
    var contest = this.props.data;
    return (
      <tr onClick={this.handleClick}>
        <td>{contest.sport}</td>
        <td>{contest.type}</td>
        <td>{contest.type}</td>
        <td>{formatTime(contest.contestDeadlineTime)}</td>
        <td>{contest.currentEntries + " / " + contest.maximumEntries}</td>
        <td>{contest.entryFee}</td>
        <td>{contest.totalPrizePool}</td>
        <td>{contest.startingVirtualMoney}</td>
        <td>
          <a className='enterbtn' href={'/contestBEntry/' +contest.contestId}>
            Enter
          </a>
        </td>
      </tr>
    );
  }
});

React.renderComponent(
  <ContestTable url='populateContestBTable' pollInterval={2000} />,
  document.getElementById('contestTable')
);

/*
 * ====================================================================
 * CONTEST BACKDROP
 * ====================================================================
 */

var ContestBackdrop = React.createClass({
  handleClick: function() {
    // State changes
    $('body').toggleClass('dialogIsOpen');
  },
  render: function() {
    return (
      <div className='contest-backdrop' onClick={this.handleClick}>
      </div>
    );
  }
});

React.renderComponent(
  <ContestBackdrop />,
  document.getElementById('contest-backdrop-wrapper')
);

/*
 * ====================================================================
 * CONTEST DIALOG BOX
 * ====================================================================
 */

var ContestDialogBox = React.createClass({
  render: function() {
    var contest = this.props.data;
    contest.games = contest.games.map(function(game) {
      return JSON.parse(game);
    });
    return (
      <div className='contest-dialog-box' style={{'text-align': 'center'}}>
        <div className='contest-dialog-box-header'>
          <h2> {contest.type} - ${contest.totalPrizePool} Prize Pool </h2>
        </div>
        <div className='contest-dialog-box-body'>
          <div className='contest-dialog-box-info'>
            <p> Entry Fee: ${contest.entryFee} </p>
            <p> {contest.entriesAllowedPerContestant} {contest.entriesAllowedPerContestant === 1 ? ' Entry' : ' Entries'} Allowed per Contestant </p>
            <ContestDialogBoxGames data={contest.games} />
          </div>
          <ContestDialogBoxTabs data={contest} /> 
        </div>
        <div className='contest-dialog-box-footer'>
          <a className='enterbtn contest-dialog-box-button' href={'/contestBEntry/' + contest.contestId}>
            Enter
          </a>
        </div>
      </div>
    );
  }
})

var ContestDialogBoxGames = React.createClass({
  render: function() {
    var games = this.props.data;
    var gameTeamNodes = games.map(function(game) {
      return (
        <td>
          {game.shortHomeTeam} at {game.shortAwayTeam}
        </td>
      );
    });
    var gameTimeNodes = games.map(function(game) {
      return (
        <td>
          {formatTime(game.gameDate)}
        </td>
      );
    });
    return (
      <table id='games'>
        <tr>
          {gameTeamNodes}
        </tr>
        <tr>
          {gameTimeNodes}
        </tr>
      </table>
    );
  }
});

var ContestDialogBoxTabs = React.createClass({

  handleClick: (function() {
    var activeTabIndex = -1;
    var tabNames = ['tab1', 'tab2', 'tab3', 'tab4']
    
    return function (event) {
      for (var i = 0; i < tabNames.length; i++) {
        if (event.target.id === tabNames[i]) {
          activeTabIndex = i;
        }
        else {
          $('#' + tabNames[i]).removeClass('active');
          $('#' + tabNames[i] + '-content').css('display', 'none');
        }
      }

      $('#' + tabNames[activeTabIndex] + '-content').fadeIn();
      $('#' + tabNames[activeTabIndex]).addClass('active');

      return false;
    };
  })(),

  render: function() {
    var contest = this.props.data;
    contest.athletes = contest.athletes.map(function (athlete) {
      return JSON.parse(athlete);
    });
    return (
      <div className='contest-dialog-box-tab-container'>
        <ul className='contest-dialog-box-tab-menu'>
          <li className='contest-dialog-box-tab active' id='tab1' onClick={this.handleClick}>Info</li>
          <li className='contest-dialog-box-tab' id='tab2' onClick={this.handleClick}>Entries</li>
          <li className='contest-dialog-box-tab' id='tab3' onClick={this.handleClick}>Prizes</li>
          <li className='contest-dialog-box-tab' id='tab4' onClick={this.handleClick}>Instances</li>
        </ul>
        <div className='contest-dialog-box-tab-content-top-border'>
        </div>
        <ContestDialogBoxTab1 data={contest} />
        <ContestDialogBoxTab2 data={contest.contestants} />
        <ContestDialogBoxTab3 data={contest.payouts} />
        <ContestDialogBoxTab4 data={{"athletes": contest.athletes, "userContestantInstances": contest.userContestantInstances, "contestId" : contest.contestId}} />
      </div>
    );
  }
});


var ContestDialogBoxTab1 = React.createClass({
  render: function() {
    var contest = this.props.data;
    var athleteNodes = contest.athletes.map(function(athlete) {
      return (
        <tr>
          <td>{athlete.athleteName}</td>
          <td>{athlete.shortTeamName}</td>
          <td>{athlete.position}</td>
        </tr>
      );
    });
    return (
      <div className='contest-dialog-box-tab-content active' id='tab1-content'>
        <p> Pick players from the following list and determine their values: </p>
        <table style={{width: 700}}>
          <thead>
            <tr>
              <th>Athlete Name</th>
              <th>Team Name</th>
              <th>Position</th>
            </tr>
          </thead>
          <tbody>
            {athleteNodes}
          </tbody>
        </table>
        <br></br>
        <br></br>
        <p> Scoring Categories </p>
        <p>
          Hitters: 1B = 1pt, 2B = 2pts, 3B = 3pts, HR = 4pts, RBI = 1pt, R = 1pt, BB = 1pt, SB = 2pts, HBP = 1, Out (calculated as at bats - hits) = -.25pt  
          <br></br>
          Pitchers: W = 4pts, ER = -1pt, SO = 1pt, IP = 1pt
        </p>
        <br></br>
        <p> *Must invest all ${contest.startingVirtualMoney} of starting virtual money </p>
        <p> *Maximum investment amount is ${contest.maxWager} on a single player </p>
      </div>
    );
  }
});

var ContestDialogBoxTab2 = React.createClass({
  render: function() {
    var contestantNodes = this.props.data.map(function(contestant) {
      return (
        <tr>
          <td>{contestant.username}</td>
          <td>{contestant.instanceCount}</td>
        </tr>
      );
    });
    return (
      <div className='contest-dialog-box-tab-content' id='tab2-content'>
        <p> List of Participants:  </p>
        <table id='participants' style={{width: 700}}>
          <tr>
            <th>Username</th>
            <th>Number of Instances</th>
          </tr>
          {contestantNodes}
        </table>
      </div>
    );
  }
});

var ContestDialogBoxTab3 = React.createClass({
  render: function() {
    var payouts = this.props.data;
    var payoutNodes = Object.keys(payouts).map(function(key) {
      return (
        <tr>
          <td>{Number(key) + 1}</td>
          <td>${payouts[key]}</td>
        </tr>
      );
    });
    return (
      <div className='contest-dialog-box-tab-content' id='tab3-content'>
        <p> List of Payouts:  </p>
        <table id='payouts' style={{width: 700}}>
          <tr>
            <th>Rank</th>
            <th>Payout</th>
          </tr>
          {payoutNodes}
        </table>
      </div>
    );
  }
});

var ContestDialogBoxTab4 = React.createClass({
  render: function() {
    var athletes = this.props.data.athletes;
    var contestId = this.props.data.contestId;
    var userContestantInstances = this.props.data.userContestantInstances;
    var userContestantInstanceNodes = userContestantInstances.map(
      function(userContestantInstance, index) {
        var betNodes = athletes.map(function(athlete, index) {
          return (
            <tr>
              <td>{athlete.athleteName}</td>
              <td>{userContestantInstance.predictions[index]}</td>
              <td>{'$' + userContestantInstance.wagers[index]}</td>
            </tr>
          );
        });
        return (
          <a href={'/contestBEdit/' + contestId + '/' + index}>
            <div className='contest-dialog-box-bet-wrapper'>
              <p>Instance: {index + 1} Money Remaining: {'$' + userContestantInstance.virtualMoneyRemaining}</p>
              <table style={{width: 700}}>
                <tr>
                  <th>Athlete Name</th>
                  <th>Prediction</th>
                  <th>Wager</th>
                </tr>
                {betNodes}
              </table>
              <p>Last Modified: {userContestantInstance.lastModified} Join Time: {userContestantInstance.joinTime}</p>
            </div>
          </a>
        );
      });
    return (
      <div className='contest-dialog-box-tab-content' id='tab4-content'>
        <p> List of Your Instances:  </p>
        <div id="instances">
          {userContestantInstanceNodes}
        </div>
      </div>
    );
  }
});

/* jshint ignore:end */