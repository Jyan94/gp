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
    setInterval(this.loadCommentsFromServer, this.props.pollInterval);
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

        <ContestList data={this.state.data} />

      </table>
    );
  }
});

var ContestList = React.createClass({
  render: function() {
    var contestNodes = this.props.data.map(function(contest, index) {
      return (
        <tr>
          <td>{contest.sport}</td>
          <td>{contest.type}</td>
          <td>{contest.type}</td>
          <td>{contest.contestStartTime}</td>
          <td>{contest.currentEntries}</td>
          <td>{contest.entryFee}</td>
          <td>{contest.totalPrizePool}</td>
          <td>{contest.startingVirtualMoney}</td>
          <td>
            <a className="enterbtn" href="/tournamentEntry/{this.contestId}">
              Enter
            </a>
          </td>
        </tr>
      );
    });
    return (
      <tbody className="contestList">
        {contestNodes}
      </tbody>
    );
  }
});

React.renderComponent(
  <ContestTable url="contests" pollInterval={2000} />,
  document.getElementById('content')
);
/* jshint ignore:end */