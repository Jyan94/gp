CREATE KEYSPACE IF NOT EXISTS "goprophet"
    WITH REPLICATION = {'class': 'SimpleStrategy', 'replication_factor': 1};

USE goprophet;

CREATE TABLE IF NOT EXISTS users(
    user_id uuid PRIMARY KEY,
    email text,
    verified boolean,
    verified_time timeuuid,
    username text,
    password text,
    first_name text,
    last_name text,
    age int,
    address text,
    payment_info text,
    money double,
    fbid text,
    vip_status int,
    image text
);

CREATE INDEX IF NOT EXISTS ON users (username);
CREATE INDEX IF NOT EXISTS ON users (email);

CREATE TABLE IF NOT EXISTS user_id_to_bet_id (
    user_id uuid,
    bet_id timeuuid,
    PRIMARY KEY (user_id, bet_id)
);

CREATE TABLE IF NOT EXISTS pending_bets (
    bet_id timeuuid PRIMARY KEY,
    user_id uuid,
    long_position boolean,
    player_id uuid,
    bet_value double,
    multiplier double,
    game_id uuid,
    expiration timeuuid,
);

CREATE INDEX IF NOT EXISTS ON pending_bets(player_id);

CREATE TABLE IF NOT EXISTS current_bets (
    bet_id timeuuid PRIMARY KEY,
    long_better_id uuid,
    short_better_id uuid,
    player_id uuid,
    bet_value double,
    multiplier double,
    game_id uuid,
    expiration timeuuid
);

CREATE TABLE IF NOT EXISTS past_bets (
    bet_id timeuuid PRIMARY KEY,
    long_better_id uuid,
    short_better_id uuid,
    player_id uuid,
    bet_value double,
    multiplier double,
    long_better_payoff bigint,
    short_better_payoff bigint,
    game_id uuid,
    expiration timeuuid,
);

CREATE TABLE IF NOT EXISTS all_bets (
    bet_id timeuuid PRIMARY KEY,
    long_better_id uuid,
    short_better_id uuid,
    player_id uuid,
    bet_value double,
    multiplier double,
    long_better_payoff bigint,
    short_better_payoff bigint,
    game_id uuid,
    expiration timeuuid,
);

CREATE TABLE IF NOT EXISTS football_player (
    player_id uuid PRIMARY KEY,
    currvalue double,
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
<<<<<<< HEAD
    image text
=======
    image text,
>>>>>>> 286d7222bfaaf046260b64443969a3d2cc519999
);

CREATE TABLE IF NOT EXISTS football_team (
    team_id uuid PRIMARY KEY,
    city text,
    name text,
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
    away_score int,
);

CREATE TABLE IF NOT EXISTS football_meta (
    version int PRIMARY KEY,
    season_type text,
    season_year int,
    week int,
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
    fumbles_lost int,
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
    finished boolean,
<<<<<<< HEAD
);

<<<<<<< HEAD
CREATE TABLE IF NOT EXISTS player_images (
    player_name text PRIMARY KEY,
    image_url text
);
=======
INSERT INTO users (user_id, username) VALUES (00000000-0000-0000-0000-000000000001, 'Bobob');
INSERT INTO users (user_id, username) VALUES (00000000-0000-0000-0000-000000000002, 'Mang');
INSERT INTO user_id_to_bet_id (user_id, bet_id) VALUES (00000000-0000-0000-0000-000000000001, 2e4ac100-31f1-11e2-9286-14109fcdd33b);
INSERT INTO user_id_to_bet_id (user_id, bet_id) VALUES (00000000-0000-0000-0000-000000000001, 2e4ac100-31f1-11e2-9287-14109fcdd33b);
INSERT INTO user_id_to_bet_id (user_id, bet_id) VALUES (00000000-0000-0000-0000-000000000001, 2e4ac100-31f1-11e2-9288-14109fcdd33b);
INSERT INTO user_id_to_bet_id (user_id, bet_id) VALUES (00000000-0000-0000-0000-000000000002, 2e4ac100-31f1-11e2-9288-14109fcdd33b);
INSERT INTO pending_bets (bet_id, user_id) VALUES (2e4ac100-31f1-11e2-9286-14109fcdd33b, 00000000-0000-0000-0000-000000000001);
INSERT INTO pending_bets (bet_id, user_id) VALUES (2e4ac100-31f1-11e2-9287-14109fcdd33b, 00000000-0000-0000-0000-000000000001);
INSERT INTO current_bets (bet_id, long_better_id, short_better_id) VALUES (2e4ac100-31f1-11e2-9288-14109fcdd33b, 00000000-0000-0000-0000-000000000001, 00000000-0000-0000-0000-000000000002);
>>>>>>> 286d7222bfaaf046260b64443969a3d2cc519999
=======
);
>>>>>>> fb4e3a3dd2f029eb887c09187c4b74a8b80ef36c
