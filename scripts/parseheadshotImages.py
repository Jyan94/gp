from cassandra.cluster import Cluster
import json

cluster = Cluster(['localhost'])
session = cluster.connect('goprophet')


json_data=open('headshotImages.json')

data = json.load(json_data)

length = len(data["assetlist"]["asset"])
print length
for num in range(240, length):
  title = data["assetlist"]["asset"][num]["title"][1: -1]
  print title
  href = data["assetlist"]["asset"][num]["links"]["link"][0]["@href"]
  url = 'http://api.sportsdatallc.org/nfl-images-t2/usat' + href + '?api_key=3khf4k9vsw7tmkzf7f56ej8u'
  session.execute(
        """
        INSERT INTO player_images (player_name, image_url)
        VALUES (%s, %s)
        """
        ,(title, url)
      )