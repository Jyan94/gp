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
for num in range(425, 428):
  title = data["assetlist"]["asset"][num]["title"][1: -1]
  print title
  print num
  href = data["assetlist"]["asset"][num]["links"]["link"][0]["@href"]
  athleteId = data["assetlist"]["asset"][num]["@player_id"]
  url = 'http://api.sportsdatallc.org/nba-images-t2/usat' + href + '?api_key=sjxhkfbfvrpdmkp2xjpzdf2d'
  urllib.urlretrieve(url, '/Users/Owner2/Documents/GPbasketball/' + athleteId)
  time.sleep(3);
  #session.execute(
        #"""
        #INSERT INTO player_images (player_name, image_url)
        #VALUES (%s, %s)
        #"""
        #,(title, url)
      #)