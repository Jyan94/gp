USE goprophet;

CREATE TABLE IF NOT EXISTS contest_B (
  athletes map<int, text>,
  commission_earned int,
  contest_deadline_time timestamp,
  contest_end_time timestamp,
  contest_id uuid,
  contest_start_time timestamp,
  contest_state int,
  contestants map<text, text>,
  current_entries int,
  entries_allowed_per_contestant int,
  entry_fee int,
  game_type text,
  game_version int,
  last_locked timestamp,
  lock_current_entries boolean,
  max_wager int,
  maximum_entries int,
  minimum_entries int,
  pay_outs map<int, double>,
  processed_payouts_time timestamp,
  sport text,
  starting_virtual_money int,
  total_prize_pool int,
  PRIMARY KEY (sport, contest_state, contest_id)
);
CREATE INDEX IF NOT EXISTS ON contest_B(contest_id);
CREATE INDEX IF NOT EXISTS ON contest_B(KEYS(contestants));
/*
athletes map of int to stringified athlete object:
{
  athleteId: uuid of athlete
  athleteName: name of athlete
}

contestants map of username to stringified contestant object:
{
  instances: [
  {
    virtualMoneyRemaining : money remaining
    wagers: array of amounts wagered, indexed 0 - num athletes initialized to 0's
    [0, 0, 0, 0, 0, ...]
    predictions: array of predicted fantasy values
    [value0, value1, value2, ...]
    //should add timestamp too, prevent users from changing too frequently
  },
  ...
  ]
}
 */

/*
sport is lowercase text
use username as key for contestants map
use int as key for athletes in game as tournament ids
contest_start_time - when we create the contest
contest_deadline_time - actually matters for contestants, deadline for submitting
contest_end_time - is end time of the real-world event and after processing payouts
commission earned, processed_payouts - updated after contest ends
lock_current_entries - lock on adding and subtracting from current_entries
contest states:
0: after created and before deadline
1: filled
2: after deadline
3: processed payouts
4: cancelled


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
  date text,
  season_type text,
  status text,
  home_team text,
  away_team text,
  home_score int,
  away_score int,
  play_by_play list<text>
);

CREATE INDEX IF NOT EXISTS on baseball_game(date);

CREATE TABLE IF NOT EXISTS baseball_player_game_statistics (
  statistic_id uuid PRIMARY KEY,
  player_id uuid,
  sport text,
  date timestamp,
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

CREATE TABLE IF NOT EXISTS timeseries_fantasy_values (
    player_id uuid,
    time timeuuid,
    fantasy_value double,
    virtual_money_wagered int,
    contest_type text,
    PRIMARY KEY (player_id, time)
) WITH CLUSTERING ORDER BY (time ASC);