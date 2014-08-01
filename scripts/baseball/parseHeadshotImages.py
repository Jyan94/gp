from cassandra.cluster import Cluster
import wget
import json
import uuid
import urllib
import urllib2
import time

cluster = Cluster(['localhost'])
session = cluster.connect('goprophet')


json_data=open('headshotImages.json')

data = json.load(json_data)

length = len(data["assetlist"]["asset"])
print length
for num in range(300, 1000):
  title = data["assetlist"]["asset"][num]["title"][1: -1]
  print title
  athleteId = data["assetlist"]["asset"][num]["@athlete_id"]
  href = data["assetlist"]["asset"][num]["links"]["link"][0]["@href"]
  url = 'http://api.sportsdatallc.org/mlb-images-t2/usat' + href + '?api_key=rb3fsknzj4z46f2mjbnu23ef'
  print url
  urllib.urlretrieve(url, '/Users/Owner2/Documents/GPbaseball2/' + athleteId)
  time.sleep(3);
  session.execute(
        """
        INSERT INTO player_images (player_name, image_url)
        VALUES (%s, %s)
        """
        ,(title, url)
      )