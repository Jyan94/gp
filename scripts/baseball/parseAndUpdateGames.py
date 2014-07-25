import datetime
import time
import requests
from xml.dom import minidom
import time
import json
from cassandra.cluster import Cluster
cluster = Cluster(['localhost'])
session = cluster.connect('goprophet')
import uuid

accessLevel = 't'
version = '4'

timeNow = time.time()
timePast = timeNow - 86400

key = 'grnayxvqv4zxsamxhsc59agu'
timesRequested = 0

def getPlayers(event, side):
  players = []

  teamAttributes = event.getElementsByTagName(side)[0].attributes
  isOnHomeTeam = (True if side == "home" else False)
  shortTeamName = teamAttributes['abbr'].value
  longTeamName = teamAttributes['market'].value + ' ' + teamAttributes['name'].value
  teamId = teamAttributes['id'].value

  if (len(event.getElementsByTagName('game')[0].getElementsByTagName(side)) == 0):
    return (teamId, shortTeamName, longTeamName, players)
  else:
    playersList = event.getElementsByTagName('game')[0].getElementsByTagName(side)[0]

    if len(playersList.getElementsByTagName('roster')) == 0:
      return (teamId, shortTeamName, longTeamName, players)
    else:
      rosterPlayerList = playersList.getElementsByTagName('roster')[0].getElementsByTagName('player')

      for player in rosterPlayerList:
        playerAttributes = player.attributes
        athleteId = playerAttributes['id'].value

        athleteName = playerAttributes['preferred_name'].value + ' ' + playerAttributes['last_name'].value
        newPlayer = { 'athleteId': athleteId, 'athleteName': athleteName, 'isOnHomeTeam': isOnHomeTeam, 'shortTeamName': shortTeamName, 'longTeamName': longTeamName, 'teamId': teamId }
        players.append(json.dumps(newPlayer))

      return (teamId, shortTeamName, longTeamName, players)

def getStatistics(statistics, side, gameId, awayInfo, homeInfo, date, year):
  athleteIdList = []
  statisticsList = []

  sideList = statistics.getElementsByTagName(side)[0]
  pitchingList = sideList.getElementsByTagName('pitching')[0].getElementsByTagName('players')[0].getElementsByTagName('player')
  hittingList = sideList.getElementsByTagName('hitting')[0].getElementsByTagName('players')[0].getElementsByTagName('player')

  for pitcher in pitchingList:
    fantasyPoints = 0

    pitcherAttributes = pitcher.attributes
    athleteId = pitcherAttributes['id'].value
    inningsPitched = int(pitcherAttributes['ip_1'].value)

    gamesAttributes = pitcher.getElementsByTagName('games')[0].attributes
    if (int(gamesAttributes['save'].value) == 1):
      fantasyPoints += 5;
    if (int(gamesAttributes['win'].value) == 1):
      fantasyPoints += 7
    if (int(gamesAttributes['loss'].value) == 1):
      fantasyPoints -= 5

    outsAttributes = pitcher.getElementsByTagName('outs')[0].attributes
    strikeouts = int(outsAttributes['ktotal'].value)

    runsAttributes = pitcher.getElementsByTagName('runs')[0].attributes
    era = float(runsAttributes['earned'].value)
    if (era <= 3) and (inningsPitched > 21):
      fantasyPoints += 3

    onbaseAttributes = pitcher.getElementsByTagName('onbase')[0].attributes
    hitsAllowed = int(onbaseAttributes['h'].value)
    bbAllowed = int(onbaseAttributes['bb'].value)
    hbpAllowed =int(onbaseAttributes['hbp'].value)

    fantasyPoints += (0.5 * strikeouts - era - hitsAllowed - bbAllowed - hbpAllowed + inningsPitched)

    athleteIdList.append(athleteId)

    newStatistics = {}
    newStatistics['athleteId'] = athleteId
    newStatistics['sport'] = 'Baseball'
    newStatistics['shortHomeTeam'] = homeInfo[1]
    newStatistics['longHomeTeam'] = homeInfo[2]
    newStatistics['gameId'] = gameId
    newStatistics['year'] = year
    newStatistics['shortVisitorTeam'] = awayInfo[1]
    newStatistics['longVisitorTeam'] = awayInfo[2]
    newStatistics['isOnHomeTeam'] = (True if side == 'home' else False)
    newStatistics['gameDate'] = date
    newStatistics['singles'] = 0
    newStatistics['doubles'] = 0
    newStatistics['triples'] = 0
    newStatistics['homeruns'] = 0
    newStatistics['runs'] = 0
    newStatistics['rbi'] = 0
    newStatistics['stolen'] = 0
    newStatistics['caught'] = 0
    newStatistics['bb'] = 0
    newStatistics['era'] = era
    newStatistics['strikeouts'] = 0
    newStatistics['hbp'] = 0
    newStatistics['strikeoutsPitched'] = strikeouts
    newStatistics['bbAllowed'] = bbAllowed
    newStatistics['hbpAllowed'] = hbpAllowed
    newStatistics['fantasyPoints'] = fantasyPoints

    statisticsList.append(json.dumps(newStatistics))

  for hitter in hittingList:
    hitterAttributes = hitter.attributes

    if (hitterAttributes['id'].value not in athleteIdList):
      fantasyPoints = 0
      athleteId = hitterAttributes['id'].value

      rbi = int(hitterAttributes['rbi'].value)

      onbaseAttributes = hitter.getElementsByTagName('onbase')[0].attributes
      singles = int(onbaseAttributes['s'].value)
      doubles = int(onbaseAttributes['d'].value)
      triples = int(onbaseAttributes['t'].value)
      homeruns = int(onbaseAttributes['hr'].value)
      bb = int(onbaseAttributes['bb'].value)
      hbp = int(onbaseAttributes['hbp'].value)

      runsAttributes = hitter.getElementsByTagName('runs')[0].attributes
      runs = int(runsAttributes['total'].value)

      stealAttributes = hitter.getElementsByTagName('steal')[0].attributes
      caught = int(stealAttributes['caught'].value)
      stolen = int(stealAttributes['stolen'].value)

      outsAttributes = hitter.getElementsByTagName('outs')[0].attributes
      strikeouts = int(outsAttributes['ktotal'].value)

      fantasyPoints += (singles + 2 * doubles + 3 * triples + 4 * homeruns + rbi + bb + hbp + runs - caught - strikeouts / 2.0 + 2 * stolen)

      athleteIdList.append(athleteId)

      newStatistics = {}
      newStatistics['athleteId'] = athleteId
      newStatistics['sport'] = 'Baseball'
      newStatistics['shortHomeTeam'] = homeInfo[1]
      newStatistics['longHomeTeam'] = homeInfo[2]
      newStatistics['gameId'] = gameId
      newStatistics['year'] = year
      newStatistics['shortVisitorTeam'] = awayInfo[1]
      newStatistics['longVisitorTeam'] = awayInfo[2]
      newStatistics['isOnHomeTeam'] = (True if side == 'home' else False)
      newStatistics['gameDate'] = date
      newStatistics['singles'] = singles
      newStatistics['doubles'] = doubles
      newStatistics['triples'] = triples
      newStatistics['homeruns'] = homeruns
      newStatistics['runs'] = runs
      newStatistics['rbi'] = rbi
      newStatistics['stolen'] = stolen
      newStatistics['caught'] = caught
      newStatistics['bb'] = bb
      newStatistics['era'] = 0
      newStatistics['strikeouts'] = strikeouts
      newStatistics['hbp'] = hbp
      newStatistics['strikeoutsPitched'] = 0
      newStatistics['bbAllowed'] = 0
      newStatistics['hbpAllowed'] = 0
      newStatistics['fantasyPoints'] = fantasyPoints

      statisticsList.append(json.dumps(newStatistics))

  return (athleteIdList, statisticsList)

def parseAndUpdateGames(timeParam):
  global timesRequested

  theDay = datetime.date.fromtimestamp(timeParam)
  year = str(theDay.year)
  month = ('0' + str(theDay.month))[-2 :]
  day = ('0' + str(theDay.day))[-2 :]
  date = year + '/' + month + '/' + day

  gamesUrl = 'http://api.sportsdatallc.org/mlb-' + accessLevel + version + '/daily/event/' + date + '.xml?api_key=' + key

  fGames = requests.get(gamesUrl).text;
  timesRequested += 1
  xmlDocGames = minidom.parseString(fGames);

  eventList = xmlDocGames.getElementsByTagName('events')[0].getElementsByTagName('event')
  for event in eventList:
    query = ""
    args = ()

    eventAttributes = event.attributes
    gameId = eventAttributes['id'].value
    status = eventAttributes['status'].value

    gameRows = session.execute('SELECT * FROM baseball_game WHERE game_id = %s;', (uuid.UUID('{' + gameId + '}'),))

    if (len(gameRows) == 0) or (gameRows[0].status != status) or (status in ['scheduled', 'inprogress']):
      startTime = event.getElementsByTagName('scheduled_start_time')[0].firstChild.nodeValue

      awayInfo = getPlayers(event, 'visitor')
      homeInfo = getPlayers(event, 'home')

      query += ("""
                INSERT INTO baseball_game (away_id, game_id, game_date, home_id, long_away_name, long_home_name, athletes, short_away_name, short_home_name, start_time, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """)
      args += (uuid.UUID('{' + awayInfo[0] + '}'), uuid.UUID('{' + gameId + '}'), date, uuid.UUID('{' + homeInfo[0] + '}'), awayInfo[2], homeInfo[2], awayInfo[3] + homeInfo[3], awayInfo[1], homeInfo[1], startTime, status)

      if (status == 'closed'):
        query = query[:-1] + ' '

        statisticsUrl = 'http://api.sportsdatallc.org/mlb-' + accessLevel + version + '/statistics/' + gameId + '.xml?api_key=' + key

        fStatistics = requests.get(statisticsUrl).text
        timesRequested += 1
        xmlDocStatistics = minidom.parseString(fStatistics)

        statistics = xmlDocStatistics.getElementsByTagName('statistics')[0]
        
        awayStatisticsInfo = getStatistics(statistics, 'visitor', gameId, awayInfo, homeInfo, date, year)
        homeStatisticsInfo = getStatistics(statistics, 'home', gameId, awayInfo, homeInfo, date, year)

        awayStatisticsInfo[0].extend(homeStatisticsInfo[0])
        awayStatisticsInfo[1].extend(homeStatisticsInfo[1])

        for i in range(len(awayStatisticsInfo[0])):
          query += ("UPDATE baseball_player SET statistics[%s] = %s WHERE athlete_id = %s ")
          args += (date, awayStatisticsInfo[1][i], uuid.UUID('{' + awayStatisticsInfo[0][i] + '}'))

        query = "BEGIN BATCH " + query + "APPLY BATCH"

      session.execute(query + ';', args)
      time.sleep(1)

parseAndUpdateGames(timeNow)
parseAndUpdateGames(timePast)

print('For parse and update games, ' + str(timesRequested) + ' request(s) was(were) made.')