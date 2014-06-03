import nfldb
from cassandra.cluster import Cluster
import uuid

cluster = Cluster(['localhost'])
session = cluster.connect('goprophet')

#
#rows = session.execute('SELECT player_id, full_name FROM football_player')
#for football_player_row in rows:
#	print football_player_row.player_id, football_player_row.full_name


db = nfldb.connect()
q = nfldb.Query(db)

q.game(season_year=2011, season_type='Regular')
for player in q.as_players():
    print player
    print player.player_id
    a = player.full_name
    b = player.player_id
    desired = int(player.player_id[0:2] + player.player_id[3:11])
    session.execute(
    	"""
    	INSERT INTO football_player (player_id, full_name)
    	VALUES (%s, %s)
    	"""
    	,(uuid.UUID(int=desired), a)
    )