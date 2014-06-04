CREATE TABLE IF NOT EXISTS timeseries_bets (
  player_id text,
  time timeuuid,
  price double,
  PRIMARY KEY (player_id, time)
) WITH CLUSTERING ORDER BY (time ASC);