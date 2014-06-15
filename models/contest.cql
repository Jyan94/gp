
CREATE TYPE IF NOT EXISTS bet (
  athlete_id uuid,
  user_id uuid,
  predicted_value double,
  amount_risked int
);

CREATE TYPE IF NOT EXISTS athlete (
  athlete_id uuid,
  athlete_name text,
  most_recent_fantasy_value double,
  market_value double
);

CREATE TYPE IF NOT EXISTS contestant_instance (
  virtual_money_remaining int,
  bets map<int, bet>
);

CREATE TYPE IF NOT EXISTS contestant (
  instances list<contestant_instance>
);

//maps athlete tournament ids to bets, stored under contestant

CREATE TABLE IF NOT EXISTS contest_B (
  contest_id uuid,
  sport text,
  starting_virtual_money int,
  buy_in int,
  pay_out_rankings list<int>,
  pay_out_values list<int>,
  pot_value_after_commission int,
  commission int,
  current_entries int,
  minimum_entries int,
  maximum_entries int,
  open_time timestamp,
  start_time timestamp,
  end_time timestamp,
  contestants map<text, contestant>,
  athletes map<int, athlete>,
  PRIMARY KEY (sport, start_time, maximum_entries, contest_id)
);
CREATE INDEX IF NOT EXISTS ON contest_B(contest_id);
//use username as key for contestants map
//use int as key for athletes in game as tournament ids

CREATE TABLE IF NOT EXISTS baseball_player_game_statistics (
  game_id uuid PRIMARY KEY,
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
CREATE INDEX IF NOT EXISTS ON baseball_player(team);
//statistics is list of baseball_player_game_statistics
