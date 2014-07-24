from cassandra.cluster import Cluster
import json
import uuid
import urllib

cluster = Cluster(['localhost'])
session = cluster.connect('goprophet')


json_data=open('headshotImages.json')

data = json.load(json_data)

length = len(data["assetlist"]["asset"])
print length
for num in range(0, length):
  title = data["assetlist"]["asset"][num]["title"][1: -1]
  print title
  athleteId = data["assetlist"]["asset"][num]["@athlete_id"]
  href = data["assetlist"]["asset"][num]["links"]["link"][0]["@href"]
  url = 'http://api.sportsdatallc.org/mlb-images-t2/usat' + href + '?api_key=9drv6ypfuenurvjw9z52fba6'
  #urllib.urlretrieve(url, '/Users/Owner2/Documents/GPbaseball/' + athleteId + '.jpg')
  session.execute(
        """
        INSERT INTO player_images (player_name, image_url)
        VALUES (%s, %s)
        """
        ,(title, url)
      )