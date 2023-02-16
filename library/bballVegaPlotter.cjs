const vega = require('vega');
const vegaLite = require('vega-lite');
const heatMapSpec = require('./vega-specs/category-heatmap.json');
const boxAndWhiskerSpec = require('./vega-specs/team-box-whisker-category.json');
const categoryBarChartSpec = require('./vega-specs/current-period-category-barchart.json');
const dayjs = require('dayjs');
const { Dayjs } = require('dayjs');
const { writeFileSync } = require('fs');


/**
 */
module.exports.getHeatMapStream = async (sortedListOfTeamsByOverallStanding, categoryLeaderboard) => {

    var teamNameMap = {};
    for(var i = 0; i < sortedListOfTeamsByOverallStanding.length; i++) {
        var currentTeam = sortedListOfTeamsByOverallStanding[i];
        teamNameMap[currentTeam.name] = currentTeam.standing + ". " + currentTeam.name + " [" + currentTeam.points + "]";
    }

    var vegaData = [];
    var teamCount = 0;
    for(categorySummary of categoryLeaderboard) {
        var teamCount = categorySummary.orderedTeams.length;
        var rank = 1;
        for(team of categorySummary.orderedTeams) {
            vegaData.push({
                "team": teamNameMap[team.name],
                "category": categorySummary.category,
                "score": team.points,
                "total": team.total,
                "rank":  team.total + "\n\n(" + team.points + ")"
            });
            rank++;
        }
    }

    heatMapSpec.data.values = vegaData;
    heatMapSpec.height = 50 + (65 * teamCount);
    var textColorConditionTest = "datum['score'] <= " + Math.round(teamCount / 2.0).toString();
    heatMapSpec.layer.push({
        "mark": "text",
        "encoding": {
            "text": {"field": "rank", "type": "ordinal"},
            "color": {
                "value": "white",
                "condition": {
                    "test": textColorConditionTest, 
                    "value": "black"
                }
            }
        }
    });
    var compiledHeatMapSpec = vegaLite.compile(heatMapSpec).spec;
    var view = new vega.View(vega.parse(compiledHeatMapSpec), {renderer: "none"});
    return view.toCanvas(3).then(function(canvas) {
        return canvas.createPNGStream();
    });
};

/**
 * @param {Dayjs} currentPeriodStart 
 * @param {Dayjs} currentPeriodEnd 
 * @returns 
 */
function getCurrentPeriodRange(currentPeriodStart, currentPeriodEnd) {
    var range = [];
    range.push({
        "year": currentPeriodStart.year(),
        "month": currentPeriodStart.month() + 1,
        "date": currentPeriodStart.date()
    });
    range.push({
        "year": currentPeriodEnd.year(),
        "month": currentPeriodEnd.month() + 1,
        "date": currentPeriodEnd.date()
    });
    return range;
};

/**
 * Generate the team box-and-whisker plot.
 * @param {dayjs} currentPeriodStart
 * @param {dayjs} currentPeriodEnd
 * @param {import('./core/teamTimeline.cjs').TeamRangeSummary} fullSeasonTeamRangeSummary
 * @returns 
 */
module.exports.getTeamBoxAndWhisker = async (currentPeriodStart, currentPeriodEnd, fullSeasonTeamRangeSummary, positions) => {
    
    const allGamesPlayed = [];
    for(var playerRangeSummary of fullSeasonTeamRangeSummary.playerRangeSummaries){
        allGamesPlayed.push(...playerRangeSummary.fullSeasonGameLog);
    }
    const activePlayersGamesPlayed = [];
    for(var game of allGamesPlayed) {
        for(var position of positions) {
            var player = fullSeasonTeamRangeSummary.currentActivePlayers[position];
            if(player.bbrefId == game.playerBbrefId) {
               activePlayersGamesPlayed.push({
                points: game.points,
                rebounds: game.rebounds,
                assists: game.assists,
                steals: game.steals,
                blocks: game.blocks,
                threePointers: game.threePointers,
                gameDateString: game.gameDateString,
                name: player.name
               });
               break;
            }
        }
    }

    boxAndWhiskerSpec.data.values = activePlayersGamesPlayed;
    boxAndWhiskerSpec.data.format = {
        "parse": {
            "points": "number",
            "rebounds": "number",
            "assists": "number",
            "steals": "number",
            "blocks": "number",
            "threePointers": "number",
            "gameDateString": "date"
        }
    };
    boxAndWhiskerSpec.repeat = ["points", "rebounds", "assists", "steals", "blocks", "threePointers"];
    boxAndWhiskerSpec.spec.layer[1].transform[1].filter.range = getCurrentPeriodRange(currentPeriodStart, currentPeriodEnd);

    var compiledBoxAndWhiskerSpec = vegaLite.compile(boxAndWhiskerSpec).spec;
    var view = new vega.View(vega.parse(compiledBoxAndWhiskerSpec), {renderer: "canvas"});
    return view.toCanvas(3).then(function(canvas) {
        return canvas.createPNGStream();
    });
};


/**
 * THIS IS THE CURRENT PERIOD CATEGORY TOTALS BAR CHART.
 * @param {LeagueData} leagueData 
 * @param {import('./core/teamTimeline.cjs').TeamRangeSummary[]} teamRangeSummaries
 * @returns {ReadableStream}
 */
module.exports.getCurrentPeriodCategoryTotalsChart = async (teamRangeSummaries) => {
    var data = [];
    for(var teamRangeSummary of teamRangeSummaries) {
        data.push({
            "Name": teamRangeSummary.team.name,
            "Points": teamRangeSummary.categoryTotal["points"],
            "Rebounds": teamRangeSummary.categoryTotal["rebounds"], 
            "Assists": teamRangeSummary.categoryTotal["assists"],
            "Steals": teamRangeSummary.categoryTotal["steals"], 
            "Blocks": teamRangeSummary.categoryTotal["blocks"], 
            "Turn Overs": teamRangeSummary.categoryTotal["turnOvers"],
            "Threes": teamRangeSummary.categoryTotal["threePointers"],
            "Field Goal %": teamRangeSummary.categoryTotal["fg%"],
            "Free Throw %": teamRangeSummary.categoryTotal["ft%"], 
        });
    }

    categoryBarChartSpec.data.values = data;
    var compiledSpec = vegaLite.compile(categoryBarChartSpec).spec;
    var view = new vega.View(vega.parse(compiledSpec), {renderer: "none"});
    return view.toCanvas(3).then(function(canvas) {
        return canvas.createPNGStream();
    });
};