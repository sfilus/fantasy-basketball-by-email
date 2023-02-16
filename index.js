
import { renderEmailText, getEmailSubjectLine, sendEmail } from './library/bballEmail.cjs';
import { getTeamGameLogs, getGameLogMapForEveryPlayerInLeague } from './library/bballScraper.mjs';
import { getHeatMapStream, getTeamBoxAndWhisker, getCurrentPeriodCategoryTotalsChart } from './library/bballVegaPlotter.cjs';
import dayjs from 'dayjs';
import * as dotenv from 'dotenv';
import { readFileSync, writeFileSync } from 'fs';
import * as teamTimeline from './library/core/teamTimeline.cjs';
import * as leagueDataLib from './library/core/leagueData.cjs';

dotenv.config();
var rawLeagueJson = readFileSync('./league.json');
var league = JSON.parse(rawLeagueJson);

// These are all the categories that we sum up for each player.
const countingCategories = ["fieldGoals", "fieldGoalAttempts", "threePointers", "threePointerAttempts", "freeThrows",
        "freeThrowAttempts", "rebounds", "assists", "steals", "blocks", "turnOvers", "points", "gameScore"];

// Categories we score based on a percentage.
const percentageCategories = [{name: "fg%", numerator: "fieldGoals", denominator: "fieldGoalAttempts"}, {name: "ft%", numerator: "freeThrows", denominator: "freeThrowAttempts"}];
 
const startingPositions = ["guardOne", "guardTwo", "forwardOne", "forwardTwo", "center"];
const reservePositions = ["reserveGuard", "reserveForward", "reserveCenter"];

const reserveMapping = {
        'guardOne': ['reserveGuard'],
        'guardTwo': ['reserveGuard'],
        'forwardOne': ['reserveForward'],
        'forwardTwo': ['reserveForward'],
        'center': ['reserveCenter']
};

const positiveCategories = ["threePointers", "rebounds", "assists", "steals", "blocks", "points", "fg%", "ft%"];
const negativeCategories = ["turnOvers"];

(async () => {

        const leagueStartDate = dayjs(league.startDate, "YYYY-MM-DD");
        var currentPeriodStart = dayjs().startOf('day').subtract(7, 'day');
        var currentPeriodEnd = dayjs().startOf('day');
        console.log("Current Period Start: ", currentPeriodStart.toISOString());
        console.log("Current Period End: ", currentPeriodEnd.toISOString());

        var gameLogMapForEveryPlayerInLeague = await getGameLogMapForEveryPlayerInLeague(
                league.teams,
                startingPositions,
                reservePositions,
                league.bbrefYear,
                currentPeriodStart,
                currentPeriodEnd
        );

        var teams = [];
        const teamTimelines =[];
        const currentPeriodTeamRangeSummaries = [];
        const fullSeasonTeamRangeSummaries = [];
        for(var team of league.teams) {
                teams.push(getTeamGameLogs(
                        team, 
                        startingPositions,
                        reservePositions,
                        gameLogMapForEveryPlayerInLeague
                ));

                const timeline = teamTimeline.buildTeamTimeline(team, leagueStartDate, startingPositions, reservePositions);
                teamTimelines.push(timeline);
                const currentPeriodTeamRangeSummary = teamTimeline.getTeamRangeSummary(timeline, team, startingPositions,currentPeriodStart,currentPeriodEnd,countingCategories,reserveMapping,percentageCategories, reservePositions);
                currentPeriodTeamRangeSummaries.push(currentPeriodTeamRangeSummary);
                const fullSeasonTeamRangeSummary = teamTimeline.getTeamRangeSummary(timeline, team, startingPositions,leagueStartDate,currentPeriodEnd,countingCategories,reserveMapping,percentageCategories, reservePositions);
                fullSeasonTeamRangeSummaries.push(fullSeasonTeamRangeSummary);
                leagueDataLib.populateTeamStats(team, fullSeasonTeamRangeSummary, currentPeriodTeamRangeSummary, countingCategories);
        }

        const playerPeriodLeaders = teamTimeline.calculatePlayerRangeLeaders(currentPeriodTeamRangeSummaries, countingCategories, percentageCategories);
        const leaderboard = leagueDataLib.calculateLeaderboard(fullSeasonTeamRangeSummaries, positiveCategories, negativeCategories);
        leagueDataLib.calculateTeamPointsAndSort(teams, leaderboard);

        var heatmapStream = await getHeatMapStream(teams, leaderboard);
        var heatmap = {
                stream: heatmapStream,
                filename: 'heatmap.png'
        };

        var barChartStream = await getCurrentPeriodCategoryTotalsChart(currentPeriodTeamRangeSummaries);
        var barChart = {
                stream: barChartStream,
                filename: 'barchart.png'
        };

        var teamCharts = [];
        for(var teamRangeSummary of fullSeasonTeamRangeSummaries) {
                
                var stream = await getTeamBoxAndWhisker(currentPeriodStart, currentPeriodEnd, teamRangeSummary, startingPositions.concat(reservePositions));
                teamCharts.push({
                        stream: stream,
                        filename: teamRangeSummary.team.id + ".png"
                });
        }

        var emailHtml = renderEmailText(
                league.leagueName,
                leaderboard, 
                teams,
                playerPeriodLeaders.playerGameOfThePeriod,
                playerPeriodLeaders.playerOfThePeriod,
                startingPositions, 
                reservePositions,
                heatmap.filename,
                barChart.filename);

        var subjectLine = getEmailSubjectLine(league.leagueName);

        var recipientList = league.emails.join();

        var messageId = await sendEmail(
                subjectLine, 
                emailHtml, 
                heatmap,
                teamCharts,
                recipientList,
                barChart);

        console.log("Message sent: %s", messageId);
})();