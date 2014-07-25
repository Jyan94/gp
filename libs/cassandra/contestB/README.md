Contest B module - "Daily Prophet"
====================================
Author: Harrison Zhao
Date: 6/2014

The low level queries and functionality for contest B. <br>
Require the exports.js file to have access to necessary functionality.

TODO: possibly implement ranks
daily_prophet serialized objects
===================================================
    athlete_names: list of athlete names (index is athleteContestId)

    /*
      the index corresponds to athlete contest id, which corresponds to the
      contestant instance's wagers and predictions array
      for example the 0th element athlete corresponds
      to the 0th element wager and 0th element prediction

      the same index strategy applies to gameContestId
    */
    athletes: list (index is athleteContestId) of stringified athlete object:
    {
      athleteId: uuid of athlete //only athlete variable used in cassandra/daily_prophet module,
      athleteName: name of athlete,
      athleteContestId: integer (0 - numGames in contest) to relate to athletes list,
      gameContestId: integer (0 - numGames in contest) to index into games list,
      gameId: timeuuid for game,
      isOnHomeTeam: boolean,
      longTeamName: full team name,
      longVersusTeamName: full opposing team name,
      position: string for position,
      shortTeamName: short string for team,
      shortVersusTeamName: short string for opposing team name,
      teamId: uuid for team
    }

    contestants: map of username to stringified contestant object:
    {
      userId: contestant userId,
      instances: [
      {
        virtualMoneyRemaining : money remaining
        wagers: array of amounts wagered, indexed 0 - num athletes initialized to 0's
        [0, 0, 0, 0, 0, ...]
        predictions: array of predicted fantasy values
        [value0, value1, value2, ...]
        lastModified: timestamp formatted as milliseconds since jan 1, 1970
        joinTime: timestamp formatted as milliseconds since jan 1, 1970
      },
      ...
      ]
    }

    games: list (index is gameContestId) of stringified game objects:
    {
      shortAwayTeam: short string for away team (i.e. NYY),
      longAwayTeam: full name for home team,
      awayTeamId: uuid for away team,
      gameDate: Date formatted as milliseconds since epoch,
      gameId: timeuuid for game,
      shortHomeTeam: short string for home team,
      longHomeTeam: full name for home team,
      homeTeamId: uuid for home team,
    }

    contest states:
    0: after created and before deadline (OPEN)
    1: filled (FILLED)
    2: after deadline (TO_PROCESS)
    3: processed payouts (PROCESSED)
    4: cancelled (CANCELLED)
    See the exports.js file to see api functions to interface with setting and getting state

Schema:

    CREATE TABLE IF NOT EXISTS daily_prophet (
      athlete_names list<text>,
      athletes map<text, text>,
      commission_earned int, //updated after processed payouts
      contest_deadline_time timestamp,  //deadline for submitting and updating instances
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
      games map<text, text>,
      isfiftyfifty boolean,
      max_wager int,
      maximum_entries int,
      minimum_entries int,
      payouts list<double>,  //0 will correspond to first place, n-1 index will correspond to nth place
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