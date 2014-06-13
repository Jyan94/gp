CREATE TYPE IF NOT EXISTS bet {
  predicted_value double,
  amount_risked int
}

CREATE TYPE IF NOT EXISTS athlete {
  athlete_id uuid,
  athlete_name text,
  most_recent_fantasy_value double,
  market_value double
}
//maybe add list of bets values??

CREATE TYPE IF NOT EXISTS contestant {
  virtual_money_remaining int,
  number_of_entries int,
  bets map<int, bet>
}
//maps athlete tournament ids to bets, stored under contestant

CREATE TABLE IF NOT EXISTS contest_B {
  contest_id uuid,
  sport text,
  starting_virtual_money int,
  buy_in int,
  pay_out_rankings list<int>,
  pay_out_values list<int>,
  pot_value_before_commission int,
  pot_value_after_commission int,
  commission int,
  current_entries int,
  minimum_entries int,
  maximum_entries int,
  open_time timestamp,
  start_time timestamp,
  end_time timestamp,
  contestants map<text, contestant>,
  athletes map<int, athlete>
  // not sure PRIMARY KEY (contest_id, sport, start_time)
}

//use username as key for contestants map
//use int as key for athletes in game as tournament ids

CREATE TABLE IF NOT EXISTS baseball_player {
  player_id uuid,
  full_name text,
  first_name text,
  last_name text,
  team text,
  status text,
  position text,
  profile_url text,
  uniform_number text,
  height text,
  weight text,
  age int,
  image text
}

CREATE TABLE IF NOT EXISTS baseball_statistics {
  
}