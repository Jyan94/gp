import datetime
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
today = datetime.date.today()
year = str(today.year)
month = ('0' + str(today.month) if today.month < 10 else str(today.month))
day = ('0' + str(today.day - 1) if today.day - 1 < 10 else str(today.day - 1))
date = year + '/' + month + '/' + day
key = 'grnayxvqv4zxsamxhsc59agu'
gamesUrl = 'http://api.sportsdatallc.org/mlb-' + accessLevel + version + '/daily/event/' + date + '.xml?api_key=' + key
print gamesUrl

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

def getStatistics():

fGames = requests.get(gamesUrl).text;
xmlDocGames = minidom.parseString(fGames);

eventList = xmlDocGames.getElementsByTagName('events')[0].getElementsByTagName('event')
for event in eventList:
  query = ""

  eventAttributes = event.attributes
  gameId = eventAttributes['id'].value
  status = eventAttributes['status'].value

  gameRows = session.execute('SELECT * FROM baseball_game WHERE game_id = %s;' gameId)

  if (len(gameRows) == 0) or (gameRows[0].status != status):
    startTime = event.getElementsByTagName('scheduled_start_time')[0].firstChild.nodeValue

    awayInfo = getPlayers(event, 'visitor')
    homeInfo = getPlayers(event, 'home')

    query += ("""
              INSERT INTO baseball_game (away_id, game_id, game_date, home_id, long_away_name, long_home_name, players, short_away_name, short_home_name, start_time, status)
              VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
              """).format((uuid.UUID('{' + awayInfo[0] + '}'), uuid.UUID('{' + gameId + '}'), date, uuid.UUID('{' + homeInfo[0] + '}'), awayInfo[2], homeInfo[2], awayInfo[3] + homeInfo[3], awayInfo[1], homeInfo[1], startTime, status)
             )

    if (status == 'closed'):
      query = query[:-1]

      statisticsUrl = 'http://api.sportsdatallc.org/mlb-' + accessLevel + version + '/statistics/' + gameId + '.xml?api_key=' + key

      fStatistics = requests.get(statisticsUrl).text
      xmlDocStatistics = minidom.parseString(fStatistics)

      statistics = xmlDocStatistics.getElementsByTagName('statistics')[0]
      statisticsInfo = getStatistics(statistics)

      query = "BEGIN BATCH " + query + " APPLY BATCH;"
    
    session.execute(query)