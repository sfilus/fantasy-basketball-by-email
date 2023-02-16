/**
 * @typedef {Object.<string, import("./team.cjs").Player[]} TeamTimeline 
 */
const dayjs = require('dayjs')
const isSameOrBefore = require('dayjs/plugin/isSameOrBefore');
const isSameOrAfter = require('dayjs/plugin/isSameOrAfter');
const isBetween = require('dayjs/plugin/isBetween');
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(isBetween);

/**
 * Get a list of the current active player for each of the passed in positions.
 * @param {TeamTimeline} timeline
 * @param {string[]} positions 
 * @returns {Object.<string, import("./team.cjs").Player>}
 */
const getCurrentlyActivePlayers = (timeline, positions, countingCategories, percentageCategories) => {
    /** @type {Object.<string, import("./team.cjs").Player>} */
    const activePlayers = {};
    for(var position of positions) {
        if(timeline[position]) {
            var indexOfMostRecentPlayer = timeline[position].length -1;
            if(indexOfMostRecentPlayer >= 0) {
                var mostRecentPlayer = timeline[position][indexOfMostRecentPlayer];
                var playerStats = calculateCategoryStats(mostRecentPlayer.gameLog, countingCategories, percentageCategories);
                mostRecentPlayer.stats = playerStats;
                activePlayers[position] = mostRecentPlayer;
            }
        }
    }
    return activePlayers;
}

/**
 * @param {TeamTimeline} timeline 
 * @param {import("./team.cjs").Player player 
 * @param {string] position 
 * @param {dayjs} transactionDate
 */
const addPlayerToTimeline = (timeline, player, position, transactionDate) => {
    if(!timeline[position]) {
        timeline[position] = [];
    }
    var indexOfMostRecentPlayer = timeline[position].length -1;
    var mostRecentPlayer = timeline[position][indexOfMostRecentPlayer];
    if(!mostRecentPlayer) {
        player.activeDateStart = transactionDate;
        timeline[position].push(player);
    } else {
        mostRecentPlayer.activeDateEnd = transactionDate.subtract(1, 'day');
        player.activeDateStart = transactionDate;
        timeline[position].push(player);
    }
};

/**
 * 
 * @param {import("./team.cjs").Team} team 
 * @param {dayjs} leagueStartDate
 * @param {string[]} startingPositions
 * @param {string[]} reservePositions
 * @returns {TeamTimeline}
 */
const buildTeamTimeline = (team, leagueStartDate, startingPositions, reservePositions) => {
    var teamTimeline = {};
    var allPositions = startingPositions.concat(reservePositions);

    for (var position of allPositions) {
        addPlayerToTimeline(teamTimeline, team.players[position], position, leagueStartDate);
    }

    if(team.transactions) {
        for(var transaction of team.transactions) {
            transaction.transactionDateObject = dayjs(transaction.transactionDateString);
            addPlayerToTimeline(teamTimeline, transaction.player, transaction.position, transaction.transactionDateObject);
        }
    }
    return teamTimeline;
};

/**
 * @typedef {Object} PlayerRangeSummary
 * @property {string} bbrefId 
 * @property {string} name
 * @property {import("../bballScraper.mjs").PlayerGameLogEntry[]} gameLog
 * @property {import("../bballScraper.mjs").InactivePlayerGameLogEntry[]} inactiveGameLog
 * @property {import("../bballScraper.mjs").PlayerGameLogEntry[]} fullSeasonGameLog
 */


/**
 * Retrieve active players during the date range. GameLog will only contain games that the player was active for.
 * For example, if a transaction subbed out a player, their games after the transaction date will not be included in the
 * GameLog or InactiveGameLog(injury).
 * @param {TeamTimeline} timeline 
 * @param {string} position 
 * @param {dayjs} rangeStartDate 
 * @param {dayjs} rangeEndDate 
 * @returns {PlayerRangeSummary[]}
 */
const getActivePlayersAtPositionBetweenDateRange = (timeline, position, rangeStartDate, rangeEndDate) => {

    var playerRangeSummaries = [];

    for(var player of timeline[position]) {

        var playersActivePeriodDidNotEndBeforeRangeStartDate = ((player.activeDateEnd == null) ||
            player.activeDateEnd.isAfter(rangeStartDate));
        var playersActivePeriodStartedOnOrBeforeTheRangeStartDate = player.activeDateStart.isSameOrBefore(rangeEndDate);
        var playerWasActiveDuringRange = playersActivePeriodDidNotEndBeforeRangeStartDate && playersActivePeriodStartedOnOrBeforeTheRangeStartDate;

        if(!player.inactiveGameLog) {
            player.inactiveGameLog = [];
        }

        if(playerWasActiveDuringRange) {
            
            var gameLogStartDate = rangeStartDate;
            if(player.activeDateStart.isAfter(rangeStartDate)) {
                gameLogStartDate = player.activeDateStart;
            }

            var gameLogEndDate = rangeEndDate;
            if(player.activeDateEnd && player.activeDateEnd.isBefore(rangeEndDate)) {
                gameLogEndDate = player.activeDateEnd;
            }

            player.gameLog.forEach(gl => {
                gl.gameDateObject = dayjs(gl.gameDateString);
            });
            player.inactiveGameLog.forEach(gl => {
                gl.gameDateObject = dayjs(gl.gameDateString);
            });

            var playerGameLogForPeriod = player.gameLog.filter(gameLogEntry => gameLogEntry.gameDateObject.isBetween(gameLogStartDate, gameLogEndDate, 'day', '[]'));
            var playerInactiveGameLogForPeriod = player.inactiveGameLog.filter(gameLogEntry => gameLogEntry.gameDateObject.isBetween(gameLogStartDate, gameLogEndDate, 'day', '[]'));

            /** @type {PlayerRangeSummary} */
            var playerRangeSummary = {
                bbrefId: player.bbrefId,
                name: player.name,
                gameLog: playerGameLogForPeriod,
                inactiveGameLog: playerInactiveGameLogForPeriod,
                fullSeasonGameLog: player.gameLog
            };
            playerRangeSummaries.push(playerRangeSummary);
        }
    }
    
    return playerRangeSummaries;
};

/**
 * @typedef AvailableSubstituteGame
 * @property {import("../bballScraper.mjs").PlayerGameLogEntry} playerGameLogEntry
 * @property {string} startingPosition
 * @property {string} startingPlayerName
 * @property {string} startingPlayerBbrefId
 * @property {string} reservePosition
 * @property {string} reservePlayerName
 * @property {string} reservePlayerBbrefId
 * @property {number} gameRank
 * @property {dayjs} startingGameDateObject
 * @property {dayjs} reserveGameDateObject
 */

/**
 * 
 * @param {TeamTimeline} timeline 
 * @param {string} startingPosition 
 * @param {import("./team.cjs").ReserveMapping} reserveMapping 
 * @param {dayjs} startingGameDate 
 * @param {number} startingGameRank 
 * @param {string} startingPlayerName 
 * @param {string} startingPlayerBbrefId
 * @returns {AvailableSubstituteGame[]}
 */
const getAvailableSubstituteGames = (timeline, startingPosition, reserveMapping, startingGameDate) => {
    const availableReservePositions = reserveMapping[startingPosition];
    /** @type {AvailableSubstituteGame[]} */
    const availableSubGames = [];

    const activeStartingPlayerArray = getActivePlayersAtPositionBetweenDateRange(timeline, startingPosition, startingGameDate, startingGameDate);
    if(activeStartingPlayerArray.length > 1) {
        throw 'More than 1 active reserve player found on a single date';
    }
    if(activeStartingPlayerArray.length == 0) {
        console.log("No starting player found for " + startingPosition + " on date "  + startingGameDate.toString());
        return [];
    }
    const activeStartingPlayer = activeStartingPlayerArray[0];
    const inactiveGameToFindSubFor = activeStartingPlayer.inactiveGameLog.find(igl => dayjs(igl.gameDateString).isSame(startingGameDate, 'day'));
    if(!inactiveGameToFindSubFor) {
        console.log("Starting player " + activeStartingPlayer.bbrefId + " was not inactive on date: " + startingGameDate.toString());
        return [];
    }

    availableReservePositions.forEach(reservePosition => {
        const activeReservePlayerArray = getActivePlayersAtPositionBetweenDateRange(timeline, reservePosition, startingGameDate, startingGameDate);
        if(activeReservePlayerArray.length > 1) {
            throw 'More than 1 active reserve player found on a single date';
        }
        if (activeReservePlayerArray.length == 0) {
            console.log("No reserve found for " + startingPosition + " -> " + reservePosition + ". " + startingGameDate.toString());
        } else {
            const activeReservePlayer = activeReservePlayerArray[0];
            const subPlayersGameOfMatchingRank = activeReservePlayer.fullSeasonGameLog.find(gle => Number(gle.rank) == Number(inactiveGameToFindSubFor.rank));
            if(subPlayersGameOfMatchingRank) {
                availableSubGames.push({
                    playerGameLogEntry: subPlayersGameOfMatchingRank,
                    gameRank: Number(inactiveGameToFindSubFor.rank),
                    reserveGameDateObject: dayjs(subPlayersGameOfMatchingRank.gameDateString),
                    reservePlayerName: activeReservePlayer.name,
                    reservePosition: reservePosition,
                    reservePlayerBbrefId: activeReservePlayer.bbrefId,
                    startingGameDateObject: dayjs(inactiveGameToFindSubFor.gameDateString),
                    startingPlayerName: activeStartingPlayer.name,
                    startingPlayerBbrefId: activeStartingPlayer.bbrefId
                });
            }
        }
    });

    return availableSubGames;
};

/**
 * 
 * @param {AvailableSubstituteGame[]} subLog 
 * @param {AvailableSubstituteGame[]} availableSubstituteGames 
 * @returns {AvailableSubstituteGame}
 */
const getFirstAvailableSubLogGame = (subLog, availableSubstituteGames) => {
    for(const availableGame of availableSubstituteGames) {
        const existingGameInSubLog = subLog.find(subLogEntry => {
            return availableGame.gameRank == subLogEntry.gameRank 
            && availableGame.reservePlayerBbrefId == subLogEntry.reservePlayerBbrefId});

        if(!existingGameInSubLog) {
            return availableGame;
        }
    }
    return null;
};

/**
 * @typedef PercentageCategory
 * @property {string} name
 * @property {string} numerator
 * @property {string} denominator
 */

/** 
 * @typedef {object} TeamRangeSummary
 * @property {Object.<string, number>} categoryTotal
 * @property {Object.<string, number>} categoryAverage
 * @property {import("../bballScraper.mjs").PlayerGameLogEntry[]} gamesStartedGameLog
 * @property {AvailableSubstituteGame[]} gamesSubbedGameLog
 * @property {import("./team.cjs").Team} team
 * @property {PlayerRangeSummary[]} playerRangeSummaries
 * @property {Number} gamesPlayed
 * @property {Object.<string, import("./team.cjs").Player} currentActivePlayers
 */

/**
 * @param {TeamRangeSummary[]} teamRangeSummaries
 * @param {string} countingCategories
 * @param {PercentageCategory[]} percentageCategories
 */
const calculatePlayerRangeLeaders = (teamRangeSummaries, countingCategories, percentageCategories) => {
    var playerGameOfThePeriod = {
            bbrefId: "",
            playerName: "",
            gameScore: 0,
            game: {}
    };

    var playerOfThePeriod = {
            averageGameScore: 0,
            bbrefId: "",
            playerName: "",
            gameLogCurrentPeriod: [],
            numGames: 0,
            gameScoreSum: 0
    };

    for(var teamRangeSummary of teamRangeSummaries) {
        for(var playerRangeSummary of teamRangeSummary.playerRangeSummaries) {
            for(var playerGameLogEntry of playerRangeSummary.gameLog) {
                
                // determine if it is the game of the period
                var currentGameScore = Number(playerGameLogEntry.gameScore);
                if(currentGameScore > playerGameOfThePeriod.gameScore) {
                    playerGameOfThePeriod.bbrefId = playerRangeSummary.bbrefId;
                    playerGameOfThePeriod.playerName = playerRangeSummary.name;
                    playerGameOfThePeriod.gameScore = playerGameLogEntry.gameScore;
                    playerGameOfThePeriod.game = playerGameLogEntry;
                }
            }

            // determine if player of the period.
            var gameScoreStats = calculateCategoryStats(playerRangeSummary.gameLog, ["gameScore"], []);
            var playerTotalGameScoreForPeriod = gameScoreStats.categoryTotals["gameScore"];
            if(playerTotalGameScoreForPeriod > playerOfThePeriod.gameScoreSum) {
                const playerPeriodStats = calculateCategoryStats(playerRangeSummary.gameLog, countingCategories, percentageCategories);
                playerOfThePeriod.averageGameScore = gameScoreStats.categoryAverages["gameScore"];
                playerOfThePeriod.bbrefId = playerRangeSummary.bbrefId;
                playerOfThePeriod.playerName = playerRangeSummary.name;
                playerOfThePeriod.gameLogCurrentPeriod = playerRangeSummary.gameLog;
                playerOfThePeriod.numGames = playerRangeSummary.gameLog.length;
                playerOfThePeriod.gameScoreSum = playerTotalGameScoreForPeriod;
                playerOfThePeriod.averageStats = playerPeriodStats.categoryAverages;
            }
        }
    }

    return {
            playerGameOfThePeriod : playerGameOfThePeriod,
            playerOfThePeriod: playerOfThePeriod
    };
}

/**
 * 
 * @param {TeamTimeline} timeline 
 * @param {import("./team.cjs").Team} team
 * @param {string[]} startingPositions 
 * @param {dayjs} rangeStartDate 
 * @param {dayjs} rangeEndDate 
 * @param {string[]} countingCategories 
 * @param {import("./team.cjs").ReserveMapping} reserveMapping 
 * @param {PercentageCategory[]} percentageCategories
 * @param {string[]} reservePositions 
 * @returns {TeamRangeSummary}
 */
const getTeamRangeSummary = (timeline, team, startingPositions, rangeStartDate, rangeEndDate, countingCategories, reserveMapping, percentageCategories, reservePositions) => {
    
    /** @type {TeamRangeSummary} */
    const teamRangeSummary = {
        categoryTotal: {},
        categoryAverage: {},
        gamesPlayed: 0,
        gamesStartedGameLog: [],
        gamesSubbedGameLog: [],
        team: team,
        playerRangeSummaries: [],
        currentActivePlayers: getCurrentlyActivePlayers(timeline, startingPositions.concat(reservePositions), countingCategories, percentageCategories)
    };

    startingPositions.forEach(position => {
        var playerRangeSummaries = getActivePlayersAtPositionBetweenDateRange(timeline, position, rangeStartDate, rangeEndDate);

        playerRangeSummaries.forEach(playerRangeSummary => {
            teamRangeSummary.playerRangeSummaries.push(playerRangeSummary);
            teamRangeSummary.gamesStartedGameLog.push(...playerRangeSummary.gameLog);

            // And push sub games to the GamesSubbedLog
            playerRangeSummary.inactiveGameLog.forEach(igl => {
                const possibleSubGames = getAvailableSubstituteGames(timeline, position, reserveMapping, igl.gameDateObject);
                const gameToSub = getFirstAvailableSubLogGame(teamRangeSummary.gamesSubbedGameLog, possibleSubGames);
                if(gameToSub) {
                    teamRangeSummary.gamesSubbedGameLog.push(gameToSub);
                }
            });
        });
    });

    const subbedGameLogEntries = teamRangeSummary.gamesSubbedGameLog.map(availableSubGame => availableSubGame.playerGameLogEntry);
    const allGamesPlayedByTeamInRange = teamRangeSummary.gamesStartedGameLog.concat(subbedGameLogEntries);
    const categoryStatistics = calculateCategoryStats(allGamesPlayedByTeamInRange, countingCategories, percentageCategories);
    teamRangeSummary.categoryTotal = categoryStatistics.categoryTotals;
    teamRangeSummary.categoryAverage = categoryStatistics.categoryAverages;
    teamRangeSummary.gamesPlayed = categoryStatistics.gamesPlayed;
    return teamRangeSummary;
};

/**
 * @typedef CategoryStatistics
 * @property {Number} gamesPlayed
 * @property {Object.<string, number>} categoryTotals
 * @property {Object.<string, number>} categoryAverages
 */

/**
 * 
 * @param {import("../bballScraper.mjs").PlayerGameLogEntry[]} playerGameLogs 
 * @param {string[]} countingCategories 
 * @param {PercentageCategory[]} percentageCategories 
 * @returns {CategoryStatistics}
 */
const calculateCategoryStats = (playerGameLogs, countingCategories, percentageCategories) => {
    /** @type {Object.<string, number>}  */
    const categoryTotal = {};
    const categoryAverages = {};
    const gamesPlayed = playerGameLogs.length;

    // sum total counting categories
    countingCategories.forEach(cat => {
        categoryTotal[cat] = 0;
        playerGameLogs.forEach(gl => {
            categoryTotal[cat] += Number(gl[cat]);
        });
    });

    // calculate percentage categories
    percentageCategories.forEach(pcat => {
        var totalNumerator = categoryTotal[pcat.numerator];
        var totalDenominator = categoryTotal[pcat.denominator];
        var percentage = 0;
        if(typeof totalNumerator == 'undefined') {
            throw 'Could not find numerator category: ' + pcat.numerator;
        }
        if(typeof totalDenominator == 'undefined') {
            throw 'Could not find denominator category: ' + pcat.denominator;
        }
        if(totalDenominator != 0) {
            percentage = (((totalNumerator/totalDenominator)) * 100).toFixed(2);
        }
        categoryTotal[pcat.name] = percentage;
        categoryAverages[pcat.name] = percentage;
    });

    // calculate averages
    countingCategories.forEach(cat => {
        var average = 0.0;
        if(gamesPlayed > 0) {
            average = (categoryTotal[cat] / gamesPlayed);
        }
        categoryAverages[cat] = average;
    });

    /** @type {CategoryStatistics} */
    return {
        categoryTotals: categoryTotal,
        categoryAverages: categoryAverages,
        gamesPlayed: gamesPlayed
    };
}

module.exports.buildTeamTimeline = buildTeamTimeline;
module.exports.getActivePlayersAtPositionBetweenDateRange = getActivePlayersAtPositionBetweenDateRange;
module.exports.getTeamRangeSummary = getTeamRangeSummary;
module.exports.getFirstAvailableSubLogGame = getFirstAvailableSubLogGame;
module.exports.getAvailableSubstituteGames = getAvailableSubstituteGames;
module.exports.getCurrentlyActivePlayers = getCurrentlyActivePlayers;
module.exports.calculatePlayerRangeLeaders = calculatePlayerRangeLeaders;