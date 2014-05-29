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
    age varint,
    address text,
    payment_info text,
    money varint,
    fbid text,
    VIP_status varint
);

CREATE TABLE IF NOT EXISTS messages(
    user_id uuid,
    message_id uuid,
    message text,
    PRIMARY KEY (user_id, message_id)
) WITH CLUSTERING ORDER BY (message_id DESC);

CREATE TABLE IF NOT EXISTS followers(
    user_id uuid,
    follower_id uuid,
    PRIMARY KEY (user_id, follower_id)
);

CREATE TABLE IF NOT EXISTS followees(
    user_id uuid,
    followee_id uuid,
    PRIMARY KEY (user_id, followee_id)
);

CREATE TABLE IF NOT EXISTS players(
    player_id uuid PRIMARY KEY,
    team_id uuid,
    first_name text,
    last_name text,
    age varint,
    biography text,
    current_value varint,
    bet_history blob,
    fantasy_points_history blob,
    trend blob,
);

CREATE TABLE IF NOT EXISTS teams(
    team_id uuid,
    player_id uuid,
    information text,
    PRIMARY KEY (team_id, player_id)
);

CREATE TABLE IF NOT EXISTS newsfeed(
    player_id uuid,
    team_id uuid,
    description text,
    link text,
    PRIMARY KEY (team_id, player_id)
);

CREATE TABLE IF NOT EXISTS user_id_to_bet_id (
    user_id uuid,
	bet_id timeuuid,
	is_long boolean,
	PRIMARY KEY (user_id, bet_id)
) WITH CLUSTERING ORDER BY (bet_id DESC);

CREATE TABLE IF NOT EXISTS current_bets (
	bet_id timeuuid PRIMARY KEY,
	player_id uuid,
	long_better_id uuid,
	short_better_id uuid,
	bet_value varint,
	multiplier varint,
	game_id uuid,
	expiration timeuuid
);

CREATE TABLE IF NOT EXISTS old_bets ( 
	bet_id timeuuid PRIMARY KEY,
	player_id uuid,
	long_better_id uuid,
	short_better_id uuid,
	bet_value varint,
	multiplier varint,
	game_id uuid,
	expiration timeuuid
);

CREATE TABLE IF NOT EXISTS games(
    game_id uuid PRIMARY KEY,
    home_team_id uuid,
    away_team_id uuid,
    home_team_score varint,
    away_team_score varint,
    game_started boolean,
    time_left varint
);
