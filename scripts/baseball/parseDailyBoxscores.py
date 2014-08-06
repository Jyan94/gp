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

key = '5ky6e4qfcf4yja97763z6pen'
timesRequested = 0

def parseDailyBoxscores(timeParam):
  global timesRequested

  theDay = datetime.date.fromtimestamp(timeParam)
  year = str(theDay.year)
  month = ('0' + str(theDay.month))[-2 :]
  day = ('0' + str(theDay.day))[-2 :]
  date = year + '/' + month + '/' + day

  dailyBoxscoresUrl = 'http://api.sportsdatallc.org/mlb-' + accessLevel + version + '/daily/boxscore/' + date + '.xml?api_key=' + key

  fGames = requests.get(dailyBoxscoresUrl).text;
  timesRequested += 1
  print timesRequested
  xmlDocGames = minidom.parseString(fGames);

  boxscoreList = xmlDocGames.getElementsByTagName('boxscores')[0].getElementsByTagName('boxscore')
  for boxscore in boxscoreList:
    boxscoreAttributes = boxscore.attributes
    gameId = boxscoreAttributes['id'].value
    status = boxscoreAttributes['status'].value

    try:
      awayScore = int(boxscore.getElementsByTagName('visitor')[0].attributes['runs'].value)
    except KeyError:
      awayScore = 0

    try:
      homeScore = int(boxscore.getElementsByTagName('home')[0].attributes['runs'].value)
    except KeyError:
      homeScore = 0

    if len(boxscore.getElementsByTagName('outcome')) > 0:
      outcomeAttributes = boxscore.getElementsByTagName('outcome')[0].attributes
      currentInning = outcomeAttributes['current_inning'].value + outcomeAttributes['current_inning_half'].value
    elif len(boxscore.getElementsByTagName('final')) > 0:
      finalAttributes = boxscore.getElementsByTagName('final')[0].attributes
      currentInning = finalAttributes['inning'].value + finalAttributes['inning_half'].value
    else:
      currentInning = '1T'

    #Do not update status if it is closed, because statistics would never update in parseAndUpdateGames script
    #Possibly merge the two scripts in the future

    if (status == 'closed'):
      session.execute("""
                      INSERT INTO baseball_game (away_score, current_inning, game_id, home_score)
                      VALUES (%s, %s, %s, %s);
                      """, (awayScore, currentInning, uuid.UUID('{' + gameId + '}'), homeScore))
    else:
      session.execute("""
                      INSERT INTO baseball_game (away_score, current_inning, game_id, home_score, status)
                      VALUES (%s, %s, %s, %s, %s);
                      """, (awayScore, currentInning, uuid.UUID('{' + gameId + '}'), homeScore, status))

  time.sleep(1)

parseDailyBoxscores(timeNow)
parseDailyBoxscores(timePast)

print('For parse and update games, ' + str(timesRequested) + ' request(s) was(were) made.')