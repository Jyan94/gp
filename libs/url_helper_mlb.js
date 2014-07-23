var config = require('../config');
var constant = require('../config/constants')

function createUrlWithEndpointAndYear(endpoint) {
    // URL should look like: http://api.sportsdatallc.org/mlb-[access_level][version]/[endpoint]/[year].xml?api_key=[your_api_key]
    return 'http://api.sportsdatallc.org/mlb-'
        + 't'
        + '4'
        + '/'
        + endpoint
        + '/'
        + '2014'
        + '.xml?api_key='
        + constant.mlbKey;
}

function createUrlWithEndpointAndDate(endpoint, year, month, day) {
    // URL should look like: http://api.sportsdatallc.org/mlb-[access_level][version]/[endpoint]/boxscore/[year]/[month]/[day].xml?api_key=[your_api_key]
    return 'http://api.sportsdatallc.org/mlb-'
        + 't'
        + '4'
        + '/'
        + endpoint
        + '/'
        + year
        + '/'
        + month
        + '/'
        + day
        + '.xml?api_key='
        + constant.mlbKey;
}

function createUrlWithEndpointAndEvent(endpoint, event) {
    // URL should look like: http://api.sportsdatallc.org/mlb-[access_level][version]/[endpoint]/[event_id].xml?api_key=[your_api_key]
    return 'http://api.sportsdatallc.org/mlb-'
        + 't'
        + '4'
        + '/'
        + endpoint
        + '/'
        + event
        + '.xml?api_key='
        + constant.mlbKey;
}

function createUrlWithEndpoint(endpoint) {
    // URL should look like: http://api.sportsdatallc.org/mlb-[access_level][version]/[endpoint]?api_key=[your_api_key]
    return 'http://api.sportsdatallc.org/mlb-'
        + 't'
        + '4'
        + '/'
        + endpoint
        + '?api_key='
        + constant.mlbKey;
}

function createUrlPlayerManifests() {
    //URL should look like http(s)://api.sportsdatallc.org/[sport]-images-[access_level][version]/[provider]/players/[image_type]/manifests/all_assets.xml?api_key=[your_api_key]
    return 'http://api.sportsdatallc.org/mlb-'
        + 'images-'
        + 't'
        + '2'
        + '/usat/players/'
        + 'headshots'
        + '/manifests/all_assets.xml?api_key='
        + '9drv6ypfuenurvjw9z52fba6';

}

function createSeasonScheduleUrl() {

    // URL should look like: http://api.sportsdatallc.org/mlb-[access_level][version]/schedule/[year].xml?api_key=[your_api_key]
    return createUrlWithEndpointAndYear('schedule');
}

function create3DayScheduleUrl() {

    // URL should look like: http://api.sportsdatallc.org/mlb-[access_level][version]/schedule-3day?api_key=[your_api_key]
    return createUrlWithEndpoint('schedule-3day');
}

function createStandingsUrl() {

    // URL should look like: http://api.sportsdatallc.org/mlb-[access_level][version]/standings/[year].xml?api_key=[your_api_key]
    return createUrlWithEndpointAndYear('standings');
}

function createGameStatisticsUrl(event) {

    // URL should look like: http://api.sportsdatallc.org/mlb-[access_level][version]/statistics/[event_id].xml?api_key=[your_api_key]
    return createUrlWithEndpointAndEvent('statistics', event);
}

function createDailyBoxscoreUrl(year, month, day) {

    // URL should look like: http://api.sportsdatallc.org/mlb-[access_level][version]/daily/boxscore/[year]/[month]/[day].xml?api_key=[your_api_key]
    return createUrlWithEndpointAndDate('daily/boxscore', year, month, day);
}

function createPlayByPlayUrl(event) {

    // URL should look like: http://api.sportsdatallc.org/mlb-[access_level][version]/pbp/[event_id].xml?api_key=[your_api_key]
    return createUrlWithEndpointAndEvent('pbp', event);
}

function createGameBoxscoreUrl(event) {

    // URL should look like: http://api.sportsdatallc.org/mlb-[access_level][version]/boxscore/[event_id].xml?api_key=[your_api_key]
    return createUrlWithEndpointAndEvent('boxscore', event);
}

function createActiveTeamRosterUrl() {

    // URL should look like: http://api.sportsdatallc.org/mlb-[access_level][version]/rosters/[year].xml?api_key=[your_api_key]
    return createUrlWithEndpointAndYear('rosters');
}

function createFullTeamRosterUrl() {

    // URL should look like: http://api.sportsdatallc.org/mlb-[access_level][version]/rosters-full/[year].xml?api_key=[your_api_key]
    return createUrlWithEndpointAndYear('rosters-full');
}

function createTeamsHierarchyUrl() {

    // URL should look like: http://api.sportsdatallc.org/mlb-[access_level][version]/teams/[year].xml?api_key=[your_api_key]
    return createUrlWithEndpointAndYear('teams');
}
    //URL should look like: http://api.sportsdatallc.org/mlb-[access_level][version]/daily/event/[year]/[month]/[day].xml?api_key=[your_api_key]
function createDailyEventInfoAndLineups(year, month, day) {
    return createUrlWithEndpointAndDate('daily/event', year, month, day);
}

function createPlayerProfiles(athlete_id) {
    return createUrlWithEndpointAndEvent('player/profile', athlete_id);
}

function createEventInfoAndLineups(event_id) {
    return createUrlWithEndpointAndEvent('event', event_id);
}

module.exports = {

    getPlayerManifestsUrl: function() {
        return createUrlPlayerManifests();
    },

    getSeasonScheduleUrl: function() {
        return createSeasonScheduleUrl();
    },

    get3DayScheduleUrl: function() {
        return create3DayScheduleUrl();
    },

    getStandingsUrl: function() {
        return createStandingsUrl();
    },

    getGameStatisticsUrl: function(event) {
        return createGameStatisticsUrl(event);
    },

    getDailyBoxscoreUrl: function(year, month, day) {
        return createDailyBoxscoreUrl(year, month, day);
    },

    getPlayByPlayUrl: function(event) {
        return createPlayByPlayUrl(event);
    },

    getGameBoxscoreUrl: function(event) {
        return createGameBoxscoreUrl(event);
    },

    getActiveTeamRosterUrl: function() {
        return createActiveTeamRosterUrl();
    },

    getFullTeamRosterUrl: function() {
        return createFullTeamRosterUrl();
    },

    getTeamsHierarchyUrl: function() {
        return createTeamsHierarchyUrl();
    },
    getDailyEventInfoAndLineups: function(year, month, day) {
        return createDailyEventInfoAndLineups(year, month, day);
    },
    getPlayerProfiles: function(athlete_id) {
        return createUrlWithEndpointAndEvent('player/profile', athlete_id);
    },
    getEventInfoAndLineups: function(event_id) {
        return createEventInfoAndLineups(event_id);
    }
}