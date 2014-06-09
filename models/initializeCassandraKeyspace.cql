CREATE KEYSPACE IF NOT EXISTS "goprophet"
    WITH REPLICATION = {'class': 'SimpleStrategy', 'replication_factor': 1};

USE goprophet;

CREATE TABLE IF NOT EXISTS users(
    userId uuid PRIMARY KEY,
    email text,
    verified boolean,
    verifiedTime timeuuid,
    username text,
    password text,
    firstName text,
    lastName text,
    age int,
    address text,
    paymentInfo text,
    money double,
    fbid text,
    vipStatus int,
    image text
);
CREATE INDEX IF NOT EXISTS ON users (username);
CREATE INDEX IF NOT EXISTS ON users (email);

CREATE TABLE IF NOT EXISTS userIdToBetId (
    userId uuid,
    betId timeuuid,
    PRIMARY KEY (userId, betId)
);

CREATE TABLE IF NOT EXISTS pendingBets (
    betId timeuuid PRIMARY KEY,
    userId uuid,
    longPosition boolean,
    playerId uuid,
    betValue double,
    multiplier double,
    gameId uuid,
    expiration timeuuid,
);

CREATE INDEX IF NOT EXISTS ON pendingBets(playerId);

CREATE TABLE IF NOT EXISTS currentBets (
    betId timeuuid PRIMARY KEY,
    longBetterId uuid,
    shortBetterId uuid,
    playerId uuid,
    betValue double,
    multiplier double,
    gameId uuid,
    expiration timeuuid
);

CREATE INDEX IF NOT EXISTS ON currentBets(playerId);

CREATE TABLE IF NOT EXISTS pastBets (
    betId timeuuid PRIMARY KEY,
    longBetterId uuid,
    shortBetterId uuid,
    playerId uuid,
    betValue double,
    multiplier double,
    longBetterPayoff bigint,
    shortBetterPayoff bigint,
    gameId uuid,
    expiration timeuuid
);

CREATE INDEX IF NOT EXISTS ON pastBets(playerId);

CREATE TABLE IF NOT EXISTS footballPlayer (
    playerId uuid PRIMARY KEY,
    currentValue double,
    fullName text,
    firstName text,
    lastName text,
    team text,
    status text,
    position text,
    profileUrl text,
    uniformNumber int,
    height int,
    weight int,
    image text
);

CREATE INDEX IF NOT EXISTS ON footballPlayer (team);

CREATE TABLE IF NOT EXISTS footballTeam (
    teamId uuid PRIMARY KEY,
    city text,
    name text
);

CREATE TABLE IF NOT EXISTS footballGame (
    gsisId uuid PRIMARY KEY,
    startTime timeuuid,
    endTime timeuuid,
    week int,
    seasonYear int,
    seasonType text,
    finished boolean,
    homeTeam text,
    awayTeam text,
    homeScore int,
    awayScore int
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

CREATE TABLE IF NOT EXISTS playerImages (
    playerName text PRIMARY KEY,
    imageUrl text
);

CREATE TABLE IF NOT EXISTS timeseriesBets (
    playerId text,
    time timeuuid,
    price double,
    PRIMARY KEY (playerId, time)
) WITH CLUSTERING ORDER BY (time ASC);
