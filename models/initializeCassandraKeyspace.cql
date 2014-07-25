CREATE KEYSPACE IF NOT EXISTS "goprophet"
    WITH REPLICATION = {'class': 'SimpleStrategy', 'replication_factor': 1};

USE goprophet;

CREATE TABLE IF NOT EXISTS users(
    age int,
    email text,
    facebook_id text,
    first_name text,
    image text,
    last_name text,
    money double,
    password text,
    payment_info text,
    privilege_level int,
    user_id uuid PRIMARY KEY,
    username text,
    verification_code timeuuid,
    verified boolean,
    verified_time timestamp
);
CREATE INDEX IF NOT EXISTS ON users (username);
CREATE INDEX IF NOT EXISTS ON users (email);

CREATE TABLE IF NOT EXISTS contest_a_bets (
    athlete_id uuid,
    athlete_name text,
    athlete_team text,
    bet_id timeuuid PRIMARY KEY,
    bet_state int,  //
    bettor_usernames map<text, text>,    //
    expirations map<text, timestamp>,   //    
    fantasy_value double,
    game_id uuid,
    is_selling_position map<text, boolean>,  //
    old_prices map<text, double>,
    payoff double,
    prices map<text, double>,
    sport text
);
CREATE INDEX IF NOT EXISTS ON contest_a_bets(athlete_name);
CREATE INDEX IF NOT EXISTS ON contest_a_bets(bet_state);
CREATE INDEX IF NOT EXISTS ON contest_a_bets(bettor_usernames);
CREATE INDEX IF NOT EXISTS ON contest_a_bets(game_id);
CREATE INDEX IF NOT EXISTS ON contest_a_bets(is_selling_position);

/*
is_selling_position - boolean for sells position,
CAREFUL FOR PENDING
if selling over, the pending bet will be placed by the under better
prices[POSITION] - price for position, if pending refers to other position
expirations[POSITION] - expiration for position, if pending refers to other position
 */

CREATE TABLE IF NOT EXISTS contest_a_bets_history (
    athlete_id uuid,
    athlete_name text,
    athlete_team text,
    bet_id timeuuid,
    fantasy_value double,
    opponent text,
    over_not_under boolean,
    payoff double,
    price double,
    sell_not_buy boolean,
    time timeuuid,
    username text,
    PRIMARY KEY (username, time)
) WITH CLUSTERING ORDER BY (time ASC);
CREATE INDEX IF NOT EXISTS ON contest_a_bets_history(bet_id);

//*_resell_value and *_resell_expiration will be null if not for resell
//bet_state: 0 (pending), 1 (active), 2 (processed) 
/*to-do condense bet tables by giving bet an int as state*/

CREATE TABLE IF NOT EXISTS football_player (
    athlete_id uuid PRIMARY KEY,
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
    image text
);
CREATE INDEX IF NOT EXISTS ON football_player (team);

CREATE TABLE IF NOT EXISTS football_team (
    team_id uuid PRIMARY KEY,
    city text,
    name text
);

CREATE TABLE IF NOT EXISTS football_game (
    gsis_id uuid PRIMARY KEY,
    start_time timeuuid,
    end_time timeuuid,
    week int,
    season_year int,
    season_type text,
    finished boolean,
    home_team text,
    away_team text,
    home_score int,
    away_score int
);

CREATE TABLE IF NOT EXISTS football_meta (
    version int PRIMARY KEY,
    season_type text,
    season_year int,
    week int
);

CREATE TABLE IF NOT EXISTS football_player_stat (
    athlete_id uuid PRIMARY KEY,
    season_year int,
    season_type text,
    finished boolean,
    week int,
    position text,
    passing_tds int,
    passing_yrds int,
    passing_twoptm int,
    rushing_yds int,
    rushing_tds int,
    rushing_twoptm int,
    receiving_yds int,
    receiving_tds int,
    receiving_twoptm int,
    fumbles_lost int
);

CREATE TABLE IF NOT EXISTS football_market_value (
    athlete_id uuid PRIMARY KEY,
    start_time timeuuid,
    end_time timeuuid,
    position text,
    game_id uuid,
    market_value int,
    season_year int,
    season_type text,
    week int,
    finished boolean
);

CREATE TABLE IF NOT EXISTS player_images (
    player_name text PRIMARY KEY,
    image_url text
);

CREATE TABLE IF NOT EXISTS timeseries_contest_a_bets (
    athlete_id uuid,
    fantasy_value double,
    price double,
    time timeuuid,
    PRIMARY KEY (athlete_id, time)
) WITH CLUSTERING ORDER BY (time ASC);