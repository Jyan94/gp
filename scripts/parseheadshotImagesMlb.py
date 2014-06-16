from cassandra.cluster import Cluster
import json
import uuid

cluster = Cluster(['localhost'])
session = cluster.connect('goprophet')


json_data=open('headshotImagesMlb.json')

data = json.load(json_data)

length = len(data["assetlist"]["asset"])
print length
for num in range(0, length):
  title = data["assetlist"]["asset"][num]["title"][1: -1]
  print title
  playerId = data["assetlist"]["asset"][num]["@player_id"]
  href = data["assetlist"]["asset"][num]["links"]["link"][0]["@href"]
  url = 'http://api.sportsdatallc.org/mlb-images-t2/usat' + href + '?api_key=9drv6ypfuenurvjw9z52fba6'
  session.execute(
        """
        INSERT INTO player_images_Mlb (player_id, player_name, image_url)
        VALUES (%s, %s, %s)
        """
        ,(uuid.UUID(playerId), title, url)
      )