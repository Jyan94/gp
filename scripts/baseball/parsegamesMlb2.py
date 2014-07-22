import datetime
import requests
from xml.dom import minidom
import json
from pprint import pprint
from cassandra.cluster import Cluster
cluster = Cluster(['localhost'])
session = cluster.connect('goprophet')
import uuid

accessLevel = 't'
version = '4'
today = datetime.date.today()
year = str(today.year)
month = ('0' + str(today.month) if today.month < 10 else str(today.month))
day = ('0' + str(today.day) if today.day < 10 else str(today.day))
date = year + '/' + month + '/' + day
key = 'grnayxvqv4zxsamxhsc59agu'
url = 'http://api.sportsdatallc.org/mlb-' + accessLevel + version + '/daily/event/' + date + '.xml?api_key=' + key
print url

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
    
    if (len(playersList.getElementsByTagName('roster')) == 0) or (len(playersList.getElementsByTagName('lineup')) == 0):
      return (teamId, shortTeamName, longTeamName, players)
    else:
      rosterPlayerList = playersList.getElementsByTagName('roster')[0].getElementsByTagName('player')
      lineupPlayerList = [player.attributes['id'].value for player in playersList.getElementsByTagName('lineup')[0].getElementsByTagName('player')]

      for player in rosterPlayerList:
        playerAttributes = player.attributes
        athleteId = playerAttributes['id'].value

        if athleteId in lineupPlayerList:
          athleteName = playerAttributes['preferred_name'].value + ' ' + playerAttributes['last_name'].value
          newPlayer = { 'athleteId': athleteId, 'athleteName': athleteName, 'isOnHomeTeam': isOnHomeTeam, 'shortTeamName': shortTeamName, 'longTeamName': longTeamName, 'teamId': teamId }
          players.append(json.dumps(newPlayer))

      return (teamId, shortTeamName, longTeamName, players)

f = requests.get(url).text;
xmlDoc = minidom.parseString(f);

eventList = xmlDoc.getElementsByTagName('events')[0].getElementsByTagName('event')
for event in eventList:
  eventAttributes = event.attributes
  gameId = eventAttributes['id'].value
  status = eventAttributes['status'].value

  startTime = event.getElementsByTagName('scheduled_start_time')[0].firstChild.nodeValue

  awayInfo = getPlayers(event, 'visitor')
  homeInfo = getPlayers(event, 'home')

  print gameId

  session.execute(
                  """
                  INSERT INTO baseball_game (away_id, game_id, game_date, home_id, long_away_name, long_home_name, players, short_away_name, short_home_name, start_time, status)
                  VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
                  """
                  , (uuid.UUID('{' + awayInfo[0] + '}'), uuid.UUID('{' + gameId + '}'), date, uuid.UUID('{' + homeInfo[0] + '}'), awayInfo[2], homeInfo[2], awayInfo[3] + homeInfo[3], awayInfo[1], homeInfo[1], startTime, status)
                )