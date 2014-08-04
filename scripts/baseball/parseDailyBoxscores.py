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
  xmlDocGames = minidom.parseString(fGames);

  boxscoreList = xmlDocGames.getElementsByTagName('boxscores')[0].getElementsByTagName('boxscore')
  for boxscore in boxscoreList:
    boxscoreAttributes = boxscore.attributes
    gameId = boxscoreAttributes['id'].value
    status = boxscoreAttributes['status'].value

    if ((status == 'inprogress') or (status == 'closed')):
      awayScore = int(boxscore.getElementsByTagName('visitor')[0].attributes['runs'].value)
      homeScore = int(boxscore.getElementsByTagName('home')[0].attributes['runs'].value)

      session.execute("""
                      INSERT INTO baseball_game (away_score, game_id, home_score)
                      VALUES (%s, %s, %s);
                      """, (awayScore, uuid.UUID('{' + gameId + '}'), homeScore))

parseDailyBoxscores(time.time())

print('For parse and update games, ' + str(timesRequested) + ' request(s) was(were) made.')