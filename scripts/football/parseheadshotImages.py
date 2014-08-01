from cassandra.cluster import Cluster
import json
import urllib
import time

cluster = Cluster(['localhost'])
session = cluster.connect('goprophet')


json_data=open('headshotImages.json')

data = json.load(json_data)

length = len(data["assetlist"]["asset"])
print length
for num in range(100, 200):
  title = data["assetlist"]["asset"][num]["title"][1: -1]
  print title
  href = data["assetlist"]["asset"][num]["links"]["link"][0]["@href"]
  athleteId = data["assetlist"]["asset"][num]["@athlete_id"]
  url = 'http://api.sportsdatallc.org/nfl-images-t2/usat' + href + '?api_key=zy23n6fdwhh6zd9wu57br3f7'
  urllib.urlretrieve(url, '/Users/Owner2/Documents/GPfootball/' + athleteId)
  time.sleep(3);
  session.execute(
        """
        INSERT INTO player_images (player_name, image_url)
        VALUES (%s, %s)
        """
        ,(title, url)
      )