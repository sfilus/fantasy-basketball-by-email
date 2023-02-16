
/**
 * @param {CategoryRankEntry[]} orderedTeams 
 */
const assignPointsToOrderedTeams = (orderedTeams) => {
    for(var i = 0; i < orderedTeams.length; i++) {
            
        var currentTotal = orderedTeams[i].total;
        var j = i; //j = number of teams tied at the same total;
        var totalPointsForTiedTeams = 0.0;
        var numberOfTiedTeams = 0;

        while(j < orderedTeams.length && orderedTeams[j].total == currentTotal) {
            totalPointsForTiedTeams += (orderedTeams.length - j);
            numberOfTiedTeams++;
            j++;
        }

        var individualTeamPoints = (totalPointsForTiedTeams/numberOfTiedTeams);
        console.log("\t Number of tied teams: " + numberOfTiedTeams + "\tTotal points: " + totalPointsForTiedTeams + "\tIndividual points: " + individualTeamPoints);

        var k = i;
        while(k < (i + numberOfTiedTeams)) {
            console.log("\t\t" + orderedTeams[k].name + "\t total=" + orderedTeams[k].total + "\tpoints" + individualTeamPoints);
            orderedTeams[k].points = individualTeamPoints;
            k++;
        }
        
        i+= (numberOfTiedTeams - 1);
    }
};

/**
 * 
 * @param {import("./teamTimeline.cjs").TeamRangeSummary[]} teamRangeSummaries 
 * @param {string[]} positiveScoringCategories 
 * @param {string[]} negativeScoringCategories 
 * @returns {CategoryRank[]}
 */
const calculateLeaderboard = (teamRangeSummaries, positiveScoringCategories, negativeScoringCategories) => {
    /** @type {CategoryRank[]} */
    var leaderboard = [];
    for(var cat of positiveScoringCategories) {
        var categoryRank = {
            category: cat,
            orderedTeams: null
        };
        /** @type {CategoryRankEntry[]} */
        var orderedTeams = teamRangeSummaries.map((trs) => {
            return {total: trs.categoryTotal[cat], "name": trs.team.name}
        }).sort((firstEl, secondEl) => {
            if(firstEl.total > secondEl.total) {
                return -1;
            }
            if(firstEl.total < secondEl.total) {
                    return 1;
            }
            return 0;
        });
        assignPointsToOrderedTeams(orderedTeams);
        categoryRank.orderedTeams = orderedTeams;
        leaderboard.push(categoryRank);
    }

    for(var cat of negativeScoringCategories) {
        /** @type {CategoryRank[]} */
        var categoryRank = {
            category: cat,
            orderedTeams: null
        };

        /** @type {CategoryRankEntry[]} */
        var orderedTeams = teamRangeSummaries.map((trs) => {
            return {total: trs.categoryTotal[cat], "name": trs.team.name}
        }).sort((firstEl, secondEl) => {
            if(firstEl.total < secondEl.total) {
                return -1;
            }
            if(firstEl.total > secondEl.total) {
                    return 1;
            }
            return 0;
        });
        assignPointsToOrderedTeams(orderedTeams);
        categoryRank.orderedTeams = orderedTeams;
        leaderboard.push(categoryRank);
    }
    return leaderboard;
} 

/**
 * 
 * @param {import("./team.cjs").Team} populatedTeams 
 * @param {CategoryRank[]} leaderboard 
 */
const calculateTeamPointsAndSort = (populatedTeams, leaderboard) => {

        // Sum up total team points based on points scored in each leaderboard category.
        leaderboard.forEach(category => {
                for(var i = 0; i < category.orderedTeams.length; i++) {
                        var pointsEarnedForThisCategory = category.orderedTeams[i].points;
                        var currentTeam = populatedTeams.filter(team => team.name === category.orderedTeams[i].name)[0];
                        if(!currentTeam.points) {
                                currentTeam.points = 0;
                        }
                        currentTeam.points += pointsEarnedForThisCategory;
                }
        });

        // Sort the teams based on total points
        populatedTeams.sort((firstEl, secondEl) => {
                if(firstEl.points > secondEl.points) {
                        return -1;
                }
                if(firstEl.points < secondEl.points) {
                        return 1;
                }
                return 0;
        });

        // Calculate team standings based on total points
        for(var i = 0; i < populatedTeams.length; i++) {
                var numberOfTiedTeams = 0;
                var j = i;
                var currentTeamPoints = populatedTeams[i].points;
                var currentStanding = i + 1;
                while(j < populatedTeams.length && populatedTeams[j].points == currentTeamPoints) {
                        populatedTeams[j].standing = currentStanding;
                        console.log(populatedTeams[j].standing + ". " + populatedTeams[j].name + "\t" + populatedTeams[j].points);
                        numberOfTiedTeams++;
                        j++;
                }
                i+=(numberOfTiedTeams - 1);
        }

};

/**
 * 
 * @param {import("./team.cjs").Team} team 
 * @param {import("./teamTimeline.cjs").TeamRangeSummary} fullSeasonTeamRangeSummary 
 * @param {import("./teamTimeline.cjs").TeamRangeSummary} currentPeriodTeamRangeSummary 
 * @param {string[]} categories 
 * 
 */
const populateTeamStats = (team, fullSeasonTeamRangeSummary, currentPeriodTeamRangeSummary, categories) => {
    const stats = {};
    stats.gamesPlayed = fullSeasonTeamRangeSummary.gamesPlayed
    categories.forEach(cat => {
        stats[cat] = {};
        stats[cat].currentPeriodTotal = currentPeriodTeamRangeSummary.categoryTotal[cat];
        stats[cat].leagueStartTotal = fullSeasonTeamRangeSummary.categoryTotal[cat];
    });
    team.stats = stats;
    team.currentPeriodSubstitutedGames = currentPeriodTeamRangeSummary.gamesSubbedGameLog;
    team.currentPeriodPlayerRangeSummaries = currentPeriodTeamRangeSummary.playerRangeSummaries;
    team.currentActivePlayers = fullSeasonTeamRangeSummary.currentActivePlayers;
}


/**
 * @typedef {object} CategoryRankEntry
 * @property {string} name
 * @property {number} total
 * @property {number} points
 */

/**
 * @typedef {object} CategoryRank
 * @property {string} category
 * @property {CategoryRankEntry[]} orderedTeams
 */

/**
 * @typedef {object} PlayerGameOfThePeriod
 * @property {string} bbrefId
 * @property {string} playerName
 * @property {number} gameScore
 * @property {import("../bballScraper.cjs").PlayerGameLogEntry} game
 */

/**
 * @typedef {object} PlayerOfThePeriod
 * @property {number} averageGameScore
 * @property {string} bbrefId
 * @property {string} playerName
 * @property {Array} gameLogCurrentPeriod
 * @property {number} numGames
 * @property {number} gameScoreSum
 * @property {Object.<string, *>} averageStats
 */

/**
 * @typedef {object} PlayerCurrentPeriodLeaders
 * @property {PlayerGameOfThePeriod} playerGameOfThePeriod
 * @property {PlayerOfThePeriod} playerOfThePeriod
 */

/**
 * @typedef {object} LeagueData
 * @property {Team[]} populatedTeams
 * @property {CategoryRank[]} leaderboard
 * @property {PlayerCurrentPeriodLeaders} playerCurrentPeriodLeaders
 */


module.exports.calculateLeaderboard = calculateLeaderboard;
module.exports.calculateTeamPointsAndSort = calculateTeamPointsAndSort;
module.exports.populateTeamStats = populateTeamStats;