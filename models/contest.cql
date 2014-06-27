USE goprophet;

CREATE TABLE IF NOT EXISTS daily_prophet (
  athlete_names list<text>,
  athletes map<text, text>,
  commission_earned int,
  contest_deadline_time timestamp,
  contest_end_time timestamp,
  contest_id timeuuid,
  contest_name text,
  contest_start_time timestamp,
  contest_state int,
  contestants map<text, text>,
  cooldown_minutes int,
  current_entries int,
  entries_allowed_per_contestant int,
  entry_fee int,
  games map<text, text>,
  isfiftyfifty boolean,
  max_wager int,
  maximum_entries int,
  minimum_entries int,
  pay_outs map<text, double>,
  processed_payouts_time timestamp,
  sport text,
  starting_virtual_money int,
  total_prize_pool int,
  PRIMARY KEY (contest_id)
);
CREATE INDEX IF NOT EXISTS ON daily_prophet(contest_state);
CREATE INDEX IF NOT EXISTS ON daily_prophet(sport);
CREATE INDEX IF NOT EXISTS ON daily_prophet(KEYS(contestants));
CREATE INDEX IF NOT EXISTS ON daily_prophet(athlete_names);

CREATE TABLE IF NOT EXISTS timeseries_daily_prophet (
    player_id uuid,
    time timeuuid,
    fantasy_value double,
    virtual_money_wagered int,
    username text,
    active boolean,
    PRIMARY KEY (player_id, time)
) WITH CLUSTERING ORDER BY (time ASC);
CREATE INDEX IF NOT EXISTS ON timeseries_daily_prophet(active);

/*
===================================================
daily_prophet serialized objects
===================================================
athlete_names: list of athlete names

athletes: map of int to stringified athlete object:
{
  athleteId: uuid of athlete //only athlete variable used in cassandra/daily_prophet module,
  athleteName: name of athlete,
  gameContestId: integer (0 - numGames in contest) to index into games map,
  gameId: uuid for game,
  isOnHomeTeam: boolean,
  position: string for position,
  shortTeamName: short string for team,
  longTeamName: full team name,
  teamId: uuid for team
}

contestants: map of username to stringified contestant object:
{
  instances: [
  {
    virtualMoneyRemaining : money remaining
    wagers: array of amounts wagered, indexed 0 - num athletes initialized to 0's
    [0, 0, 0, 0, 0, ...]
    predictions: array of predicted fantasy values
    [value0, value1, value2, ...]
    //should add timestamp too, prevent users from changing too frequently
    lastModified: timestamp formatted as milliseconds since jan 1, 1970
    joinTime: timestamp formatted as milliseconds since jan 1, 1970
  },
  ...
  ]
}

games: map of gameContestId (int) to stringified game object:
{
  awayTeam: short string for home team (i.e. NYY),
  awayTeamId: uuid for away team,
  gameDate: Date formatted as milliseconds since epoch,
  gameId: uuid for game,
  homeTeam: short string for home team ,
  homeTeamId: uuid for home team,
}

contest states:
0: after created and before deadline
1: filled
2: after deadline
3: processed payouts
4: cancelled
 */


/*
sport is lowercase text
use username as key for contestants map
use int as key for athletes in game as tournament ids
contest_start_time - when we create the contest
contest_deadline_time - actually matters for contestants, deadline for submitting
contest_end_time - is end time of the real-world event and after processing payouts
commission earned, processed_payouts - updated after contest ends
*/

/*

CREATE TYPE IF NOT EXISTS baseball_team (
  team_id uuid,
  team_name text,
  team_abbreviation
);

CREATE TYPE IF NOT EXISTS baseball_team_table (
  team_id uuid,
  team_name text,
  team_abbreviation
);*/

CREATE TABLE IF NOT EXISTS baseball_game (
  gsis_id uuid PRIMARY KEY,
  start_time text,
  end_time timeuuid,
  game_date text,
  season_type text,
  status text,
  home_team text,
  away_team text,
  home_score int,
  away_score int,
  play_by_play list<text>
);

CREATE INDEX IF NOT EXISTS on baseball_game (game_date);

CREATE TABLE IF NOT EXISTS baseball_player_game_statistics (
  statistic_id uuid PRIMARY KEY,
  player_id uuid,
  sport text,
  game_date timestamp,
  season_year int,
  season_type text,
  position_in_game text,
  singles int,
  doubles int,
  triples int,
  home_runs int,
  runs int,
  rbis int,
  stolen_bases int,
  caught_stealing_bases int,
  walks int,
  earned_runs_allowed int,
  strikeouts int,
  walks_and_hits_allowed int,
  fantasy_points double
);
CREATE INDEX IF NOT EXISTS ON baseball_player_game_statistics(player_id);

CREATE TABLE IF NOT EXISTS baseball_player (
  player_id uuid PRIMARY KEY,
  current_value double,
  full_name text,
  first_name text,
  last_name text,
  team text,
  status text,
  position text,
  profile_url text,
  uniform_number int,
  height int,
  weight int,
  age int,
  image text,
  statistics list<uuid>
);
CREATE INDEX IF NOT EXISTS ON baseball_player(full_name);
//statistics is list of baseball_player_game_statistics
