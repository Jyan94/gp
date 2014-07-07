/** @jsx React.DOM */
/* jshint ignore:start */

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
      <table id="contests" align="center" style={{width: 1000}}>
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
      <tbody className="contestRows">
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
          <a className="enterbtn" href={'/contestBEntry/' +contest.contestId}>
            Enter
          </a>
        </td>
      </tr>
    );
  }
});

React.renderComponent(
  <ContestTable url="populateContestBTable" pollInterval={2000} />,
  document.getElementById('contestTable')
);
/* jshint ignore:end */