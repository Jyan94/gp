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

CREATE TABLE IF NOT EXISTS user_id_to_bet_id (
    user_id uuid PRIMARY KEY,
    bet_id timeuuid
);

CREATE TABLE IF NOT EXISTS pending_bets (
    bet_id timeuuid PRIMARY KEY,
    username text,
    user_id uuid,
    long_position boolean,
    bet_value int,
    multiplier int,
    game_id uuid,
    expiration timeuuid
);

CREATE TABLE IF NOT EXISTS current_bets (
    bet_id timeuuid PRIMARY KEY,
    long_better_id text,
    short_better_id text,
    bet_value int,
    multiplier int,
    game_id uuid,
    expiration timeuuid
);