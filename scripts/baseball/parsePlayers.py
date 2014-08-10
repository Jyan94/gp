import requests
import datetime
from xml.dom import minidom
from cassandra.cluster import Cluster
cluster = Cluster(['localhost'])
session = cluster.connect('goprophet')
import uuid

accessLevel = 't'
version = '4'
today = datetime.date.today()
year = str(today.year)
key = '5ky6e4qfcf4yja97763z6pen'
url = 'http://api.sportsdatallc.org/mlb-' + accessLevel + version + '/rosters/' + year + '.xml?api_key=' + key
timesRequested = 0

def parseNumber(number):
	if (number == ''):
		return None
	else:
		return int(number);

f = requests.get(url).text;
timesRequested += 1
xmlDoc = minidom.parseString(f);

teamList = xmlDoc.getElementsByTagName('team')
for team in teamList:
  teamAttributes = team.attributes
  shortTeamName = teamAttributes['abbr'].value
  longTeamName = teamAttributes['market'].value + ' ' + teamAttributes['name'].value
  teamId = teamAttributes['id'].value
  playerList = team.getElementsByTagName('player')
  for player in playerList:
		playerAttributes = player.attributes
		athleteId = playerAttributes['id'].value
		firstName = playerAttributes['preferred_name'].value
		lastName = playerAttributes['last_name'].value
		fullName = firstName + ' ' + lastName
		position = playerAttributes['position'].value
		uniformNumber = parseNumber(playerAttributes['jersey'].value)
		height = parseNumber(playerAttributes['height'].value)
		weight = parseNumber(playerAttributes['weight'].value)
		session.execute(
        """
        INSERT INTO baseball_player (athlete_id, full_name, first_name, last_name, short_team_name, long_team_name, team_id, position, uniform_number, height, weight)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
        """
        , (uuid.UUID('{' + athleteId + '}'), fullName, firstName, lastName, shortTeamName, longTeamName, uuid.UUID('{' + teamId + '}'), position, uniformNumber, height, weight)
      )

print('For parse players, ' + str(timesRequested) + ' request(s) was(were) made.')