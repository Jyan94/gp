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

q.game(season_year=2013, season_type='Regular')
for player in q.as_players():
    print player
    print player.player_id
    print type(player.position)
    a = player.full_name
    b = player.player_id
    c = player.team
    d = player.position.__str__()
    desired = int(player.player_id[0:2] + player.player_id[3:11])
    session.execute(
    	"""
    	INSERT INTO football_player (athlete_id, full_name, team, position)
    	VALUES (%s, %s, %s, %s)
    	"""
    	,(uuid.UUID(int=desired), a, c, d)
    )