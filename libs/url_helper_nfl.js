function createUrlPlayerManifests() {
    //URL should look like http(s)://api.sportsdatallc.org/[sport]-images-[access_level][version]/[provider]/players/[image_type]/manifests/all_assets.xml?api_key=[your_api_key]
    return 'http://api.sportsdatallc.org/nfl-'
      + 'images-'
      + 't'
      + '2'
      + '/usat/players/'
      + 'headshots'
      + '/manifests/all_assets.xml?api_key='
      + '3khf4k9vsw7tmkzf7f56ej8u';

}

module.exports = {
  getPlayerManifestsUrl: function() {
    return createUrlPlayerManifests();
  }
}