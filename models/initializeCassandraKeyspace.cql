CREATE KEYSPACE IF NOT EXISTS "goprophet"
    WITH REPLICATION = {'class': 'SimpleStrategy', 'replication_factor': 1};

USE goprophet;

CREATE TABLE IF NOT EXISTS users(
    user_id uuid PRIMARY KEY,
    email text,
    verified boolean,
    verified_time timestamp,
    ver_code timeuuid,
    username text,
    password text,
    first_name text,
    last_name text,
    age int,
    address text,
    payment_info text,
    money double,
    spending_power double,
    fbid text,
    vip_status int,
    image text
);
CREATE INDEX IF NOT EXISTS ON users (username);
CREATE INDEX IF NOT EXISTS ON users (email);

CREATE TABLE IF NOT EXISTS contest_A_bets (
    athlete_id uuid,
    bet_id timeuuid PRIMARY KEY,
<<<<<<< HEAD
    bet_state int,
    expiration timestamp,
=======
    user_id uuid,
    long_position boolean,
    player_id uuid,
    wager double,
    fantasy_value double,
    game_id uuid,
    expiration timeuuid,
);

CREATE TABLE IF NOT EXISTS contest_A_bets (
    athlete_id uuid,
    bet_id timeuuid,
    bet_state int,
    expiration timestamp,
    fantasy_value double,
    game_id uuid,
    is_selling_long_position boolean,
    is_selling_short_position boolean,
    long_better_id uuid,
    long_better_username text,
    long_better_resell_value double,
    long_better_resell_expiration timestamp,
    short_better_id uuid,
    short_better_username text,
    short_better_resell_value double,
    short_better_resell_expiration timestamp,
    wager double
);
CREATE INDEX IF NOT EXISTS ON contest_A_bets(bet_state);
CREATE INDEX IF NOT EXISTS ON contest_A_bets(game_id);
CREATE INDEX IF NOT EXISTS ON contest_A_bets(long_better_id);
CREATE INDEX IF NOT EXISTS ON contest_A_bets(long_better_username);
CREATE INDEX IF NOT EXISTS ON contest_A_bets(short_better_id);
CREATE INDEX IF NOT EXISTS ON contest_A_bets(short_better_username);

//*_resell_value and *_resell_expiration will be null if not for resell
//bet_state: 0 (pending), 1 (active), 2 (locked), 3 (processed) 
=======
    player_id uuid,
    wager double,
    fantasy_value double,
    long_better_payoff bigint,
    short_better_payoff bigint,
    game_id uuid,
    expiration timeuuid
);

CREATE INDEX IF NOT EXISTS ON past_bets(player_id);

CREATE TABLE IF NOT EXISTS secondary_bets (
    bet_id timeuuid PRIMARY KEY,
    price double,
    long_better_id uuid,
    short_better_id uuid,
    player_id uuid,
    wager double,
    bet_value double,
    game_id uuid,
    expiration timeuuid,
);

/*to-do condense bet tables by giving bet an int as state*/
>>>>>>> 15cf142277e5e6c2045c8d13e6d63b8104de2820

CREATE TABLE IF NOT EXISTS football_player (
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
    player_id uuid PRIMARY KEY,
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
    player_id uuid PRIMARY KEY,
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

CREATE TABLE IF NOT EXISTS timeseries_bets (
    player_id text,
    time timeuuid,
    price double,
    PRIMARY KEY (player_id, time)
) WITH CLUSTERING ORDER BY (time ASC);