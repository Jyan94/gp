USE goprophet;

CREATE TABLE IF NOT EXISTS daily_prophet (
  athlete_names list<text>,
  athletes list<text>,
  commission_earned int, //updated after processed payouts
  contest_deadline_time timestamp,  //actually matters for contestants, deadline for submitting
  contest_end_time timestamp, //is end time of the real-world event(s)
  contest_id timeuuid,
  contest_name text,
  contest_start_time timestamp, //when contest was created
  contest_state int,
  contestants map<text, text>,
  cooldown_minutes int,
  current_entries int,
  entries_allowed_per_contestant int,
  entry_fee int,
  games list<text>,
  isfiftyfifty boolean,
  max_wager int,
  maximum_entries int,
  minimum_entries int,
  payouts list<double>,
  processed_payouts_time timestamp, //updated after processed payouts
  sport text, //lowercase text
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
daily_prophet tables, see readme.md in libs/cassandra/dailyProphet for more information
===================================================
*/

CREATE TABLE IF NOT EXISTS baseball_game (
  away_score int,
  end_time timestamp,
  game_id uuid PRIMARY KEY,
  game_date text,
  home_score int,
  long_away_name text,
  long_home_name text,  //full name for home team
  players list<text>,
  play_by_play list<text>,
  short_away_name text,
  short_home_name text, //acronym for home team
  start_time timestamp,
  status text
);
CREATE INDEX IF NOT EXISTS on baseball_game(game_date);

/**
 * game_id - timeuuid initialized
 * players - list of player objects
 {
    athleteId: athlete player uuid,
    athleteName: name of athlete,
    isOnHomeTeam: boolean,
    shortTeamName: short string for team,
    longTeamName: full team name,
    teamId: uuid for team
 }
 */

CREATE TABLE IF NOT EXISTS baseball_player (
  player_id uuid PRIMARY KEY,
  current_value double,
  full_name text,
  first_name text,
  last_name text,
  team_id uuid,
  short_team_name text,
  long_team_name text,
  status text,
  position text,
  profile_url text,
  uniform_number int,
  height int,
  weight int,
  age int,
  image text,
  statistics list<text>
);
CREATE INDEX IF NOT EXISTS ON baseball_player(full_name);
//statistics is list of baseball_player_game_statistics
/*
statistics: list of stringified statistics objects
{
  sport text,
  game_date (time in milliseconds since epoch),
  season_year int,
  season_type text,
  position_in_game text,
  singles int,
  doubles int,
  triples int,
  home_runs int,
  runs int,
  rbis int, //runs batted in
  stolen_bases int,
  caught_stealing_bases int,
  walks int,
  earned_runs_allowed int,
  strikeouts int,
  walks_and_hits_allowed int,
  fantasy_points double
}
 */
