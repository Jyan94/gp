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
    athlete_id uuid,
    time timeuuid,
    fantasy_value double,
    virtual_money_wagered int,
    username text,
    active boolean,
    PRIMARY KEY (athlete_id, time)
) WITH CLUSTERING ORDER BY (time ASC);
CREATE INDEX IF NOT EXISTS ON timeseries_daily_prophet(active);

/*
===================================================
daily_prophet tables, see readme.md in libs/cassandra/dailyProphet for more information
===================================================
*/

CREATE TABLE IF NOT EXISTS baseball_game (
  athletes list<text>,
  away_score int,
  away_id uuid,
  end_time timestamp,
  game_id uuid PRIMARY KEY,
  game_date text,
  home_score int,
  home_id uuid,
  long_away_name text,
  long_home_name text,  //full name for home team
  play_by_play list<text>,
  short_away_name text,
  short_home_name text, //acronym for home team
  start_time timestamp,
  status text
);
CREATE INDEX IF NOT EXISTS on baseball_game(game_date);
CREATE INDEX IF NOT EXISTS on baseball_game(start_time);

/**
 game_id - timeuuid initialized
 athletes - list of athlete objects
 {
    athleteId: athlete player uuid,
    athleteName: name of athlete,
    isOnHomeTeam: boolean,
    shortTeamName: short string for team,
    longTeamName: full team name,
    teamId: uuid for team
 }
 status: 'closed', 'scheduled', 'ongoing'?
 */

CREATE TABLE IF NOT EXISTS baseball_player (
  age int,
  athlete_id uuid PRIMARY KEY,
  first_name text,
  full_name text,
  height int,
  image_url text,
  last_name text,
  long_team_name text,
  position text,
  short_team_name text,
  statistics map<text, text>,
  status text,
  team_id uuid,
  uniform_number int,
  weight int
);
CREATE INDEX IF NOT EXISTS ON baseball_player(full_name);
CREATE INDEX IF NOT EXISTS ON baseball_player(long_team_name);
CREATE INDEX IF NOT EXISTS ON baseball_player(short_team_name);

//statistics is map of game_date to baseball_player_game_statistics
//please change this to have key of game_id
/*
statistics: map of game_id to stringified statistics objects
{
  sport text,
  gameDate (time in milliseconds since epoch),
  gameId,
  seasonYear int,
  seasonType text,
  positionInGame text,
  singles int,
  doubles int,
  triples int,
  homeRuns int,
  runs int,
  rbis int, //runs batted in
  stolenBases int,
  caughtStealingBases int,
  walks int,
  earnedRunsAllowed int,
  strikeouts int,
  walksAndHitsAllowed int,
  fantasyPoints double,
  processed boolean
}
 */
