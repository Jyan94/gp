import nfldb
from cassandra.cluster import Cluster
import uuid

cluster = Cluster(['localhost'])
session = cluster.connect('goprophet')

#
#rows = session.execute('SELECT playerId, fullName FROM footballPlayer')
#for footballPlayerRow in rows:
#	print footballPlayerRow.playerId, footballPlayerRow.fullName


db = nfldb.connect()
q = nfldb.Query(db)

q.game(season_year=2013, season_type='Regular')
for player in q.as_players():
    print player
    print player.player_id
    a = player.full_name
    b = player.player_id
    desired = int(player.player_id[0:2] + player.player_id[3:11])
    session.execute(
    	"""
    	INSERT INTO footballPlayer (playerId, fullName)
    	VALUES (%s, %s)
    	"""
    	,(uuid.UUID(int=desired), a)
    )