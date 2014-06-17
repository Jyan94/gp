CREATE TYPE IF NOT EXISTS contest_B_bet (
  predicted_value double,
  amount_risked int
);

CREATE TYPE IF NOT EXISTS contestant_instance (
  virtual_money_remaining int,
  bets map<int, contest_B_bet>
);

CREATE TYPE IF NOT EXISTS contestant (
  instances list<contestant_instance>
);

CREATE TYPE IF NOT EXISTS athlete (
  athlete_id uuid,
  athlete_name text
);

CREATE TABLE IF NOT EXISTS contest_B (
  athletes map<int, athlete>,
  cancelled boolean,
  commission_earned int,
  contest_deadline_time timestamp,
  contest_end_time timestamp,
  contest_id uuid,
  contest_start_time timestamp,
  contest_open boolean,
  contestants map<text, contestant>,
  current_entries int,
  entry_fee int,
  game_type text,
  maximum_entries int,
  minimum_entries int,
  pay_outs map<int, double>,
  processed_payouts boolean,
  processed_payouts_time timestamp,
  sport text,
  starting_virtual_money int,
  total_prize_pool int,
  PRIMARY KEY (sport, contest_open, contest_id)
);
CREATE INDEX IF NOT EXISTS ON contest_B(contest_id);
CREATE INDEX IF NOT EXISTS ON contest_B(
  sport, 
  contest_deadline_time, 
  processed_payouts, 
  contest_id);
CREATE INDEX IF NOT EXISTS ON contest_B(sport, cancelled);
CREATE INDEX IF NOT EXISTS ON contest_B(KEYS(contestants));

//sport is lowercase text
//use username as key for contestants map
//use int as key for athletes in game as tournament ids
//contest_end_time - is end time of the real-world event and after processing payouts
//deadline_time - actually matters for contestants, deadline for submitting
//contest_start_time - when we create the contest
//commission earned, processed_payouts - updated after contest ends

CREATE TYPE IF NOT EXISTS baseball_team (
  team_id uuid,
  team_name text,
  team_abbreviation
);

CREATE TYPE IF NOT EXISTS baseball_team_table (
  team_id uuid,
  team_name text,
  team_abbreviation
);

CREATE TABLE IF NOT EXISTS baseball_game (
  gsis_id uuid PRIMARY KEY,
  start_time timeuuid,
  end_time timeuuid,
  week int,
  season_year int,
  season_type text,
  finished boolean,
  home_team list<uuid>
  away_team list<uuid>,
  home_score int,
  away_score int,
  play_by_play list<text>
);

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
  home runs int,
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
