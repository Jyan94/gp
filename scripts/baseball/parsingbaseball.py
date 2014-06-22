from cassandra.cluster import Cluster
cluster = Cluster(['localhost'])
session = cluster.connect('goprophet')
import uuid

f = open("Master.csv")
a = []
for line in f:
	a = line.split(',')
	if (a[9] == ''):
		b = a[0].encode("hex")
		desired = str(b)
		while (desired.__len__() < 32):
			desired += "0"

		#inputUuid = c[:8] + "-" + c[8:12] + "-" + c[12:16] + "-" + c[16:20] + "-" + c[20:]
		print desired
		session.execute(
			"""
			INSERT INTO baseball_player (player_id, full_name, first_name, last_name)
			VALUES (%s, %s, %s, %s)
			"""
			,(uuid.UUID(desired), a[13] + ' ' + a[14], a[13], a[14])
	)