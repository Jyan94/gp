/** @jsx React.DOM */
/* jshint ignore:start */

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
        <td>{contest.contestStartTime}</td>
        <td>{contest.currentEntries}</td>
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
      </div>
    );
  }
})

var ContestDialogBoxGames = React.createClass({
  render: function() {
    var games = this.props.data.map(function(game) {
      return JSON.parse(game);
    })
    console.log(games);
    var gameTeamNodes = games.map(function(game) {
      return (
        <td>
          {game.homeTeam} at {game.awayTeam}
        </td>
      );
    });
    var gameTimeNodes = games.map(function(game) {
      return (
        <td>
          {game.gameDate}
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
        <div className='contest-dialog-box-tab-content active' id='tab1-content'>
          <p> Pick players from the following list and determine their values: </p>
          <p> Derek Jeter (SS - NYY) </p>
          <p> Alex Rodriguez (? - NYY) </p>
          <br></br>
          <br></br>
          <p> Scoring Categories </p>
          <p> Hitters: 1B = 1pt, 2B = 2pts, 3B = 3pts, HR = 4pts, RBI = 1pt, R = 1pt, BB = 1pt, SB = 2pts, HBP = 1, Out (calculated as at bats - hits) = -.25pt  
          <br></br>
          Pitchers: W = 4pts, ER = -1pt, SO = 1pt, IP = 1pt
          </p>
          <br></br>
          <p> *Must invest all ${contest.startingVirtualMoney} of starting virtual money </p>
          <p> *Maximum investment amount is ${contest.maxWager} on a single player </p>
        </div>
        <ContestDialogBoxTab2 data={contest.contestants} />
        <ContestDialogBoxTab3 data={contest.payOuts} />
        <ContestDialogBoxTab4 data={contest.userContestantInstances} />
        <div className='contest-dialog-box-tab-content' id='tab4-content'>
        </div>
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
          <td>{contestant.instancesCount}</td>
        </tr>
      );
    });
    return (
      <div className='contest-dialog-box-tab-content' id='tab2-content'>
        <p> List of Participants:  </p>
        <table id='participants' style={{width: 700}}>
          {contestantNodes}
        </table>
      </div>
    );
  }
});

var ContestDialogBoxTab3 = React.createClass({
  render: function() {
    var payOuts = this.props.data;
    var payOutNodes = Object.keys(payOuts).map(function(key) {
      return (
        <tr>
          <td>{key}</td>
          <td>${payOuts[key]}</td>
        </tr>
      );
    });
    console.log(payOutNodes);
    return (
      <div className='contest-dialog-box-tab-content' id='tab3-content'>
        <p> List of Payouts:  </p>
        <table id='payouts' style={{width: 700}}>
          {payOutNodes}
        </table>
      </div>
    );
  }
});

var ContestDialogBoxTab3 = React.createClass({
  render: function() {
    var payOuts = this.props.data;
    var payOutNodes = Object.keys(payOuts).map(function(key) {
      return (
        <tr>
          <td>{key}</td>
          <td>${payOuts[key]}</td>
        </tr>
      );
    });
    console.log(payOutNodes);
    return (
      <div className='contest-dialog-box-tab-content' id='tab3-content'>
        <p> List of Payouts:  </p>
        <table id='payouts' style={{width: 700}}>
          {payOutNodes}
        </table>
      </div>
    );
  }
});

var ContestDialogBoxTab4 = React.createClass({
  render: function() {
    var userContestantInstances = this.props.data;
    console.log(userContestantInstances);
    var userContestantInstanceNodes = userContestantInstances.map(
      function(userContestantInstance, index) {
        return (
          <tr>
            <td>{index + 1}</td>
            <td>${userContestantInstance.virtualMoneyRemaining}</td>
            <td>{userContestantInstance.wagers}</td>
            <td>{userContestantInstance.predictions}</td>
            <td>{userContestantInstance.lastModified}</td>
            <td>{userContestantInstance.joinTime}</td>
          </tr>
        );
      });
    return (
      <div className='contest-dialog-box-tab-content' id='tab4-content'>
        <p> List of Your Instances:  </p>
        <table id='instances' style={{width: 700}}>
          {userContestantInstanceNodes}
        </table>
      </div>
    );
  }
});

/* jshint ignore:end */