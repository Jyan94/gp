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
    long_better_id uuid,
    short_better_id uuid,
    player_id uuid,
    bet_value double,
    multiplier double,
    game_id uuid,
    expiration timeuuid
);

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

CREATE TABLE IF NOT EXISTS players (
    currvalue double,
    first_name text,
    last_name text,
    player_id int,
    team_id text,
    age int,
    biography text,
);