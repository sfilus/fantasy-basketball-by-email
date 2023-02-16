/**
 * @typedef {object} PlayerCategoryStatSummary
 * @property {number} completeYearTotal
 * @property {number} leagueStartTotal
 * @property {number} currentPeriodTotal
 * @property {number} average
 */

const { Dayjs, default: dayjs } = require("dayjs");

/**
 * A player on a team.
 * @typedef {object} Player
 * @property {string} name
 * @property {string} bbrefId
 * @property {import("../bballScraper.mjs").PlayerGameLogEntry[]} gameLog
 * @property {import("../bballScraper.mjs").PlayerGameLogEntry[]} gameLogCurrentPeriod
 * @property {import("../bballScraper.mjs").InactivePlayerGameLogEntry[]} inactiveGameLog
 * @property {Object.<string, PlayerCategoryStatSummary>} stats
 * @property {Object.<string, PlayerCategoryStatSummary>} currentPeriodStats
 * @property {Dayjs} activeDateStart
 * @property {Dayjs} activeDateEnd
 */

/**
 * A player transaction
 * @typedef {object} PlayerTransaction
 * @property {string} transactionDateString
 * @property {dayjs} transactionDateObject
 * @property {string} position
 * @property {Player} player
 */

/**
 * A team in the league.
 * @typedef {object} Team
 * @property {string} id team id
 * @property {string} name team name
 * @property {string} owner team owner
 * @property {Object.<string, Player>} players dictionary object with position as key and Player as value.
 * @property {PlayerTransaction[]} transactions list of transactions for the team.
 * @property {Object.<string, object>} stats
 * @property {SubstitutionLog} currentPeriodSubLog
 * @property {number} currentPeriodSubCount;
 * @property {import("../bballCalculate.cjs").SubstitutionLogCategoryTotals} CurrentPeriodSubLogTotals
 * @property {number} points
 * @property {number} standing
 * @property {import("./teamTimeline.cjs").AvailableSubstituteGame[]} currentPeriodSubstitutedGames
 * @property {import("./teamTimeline.cjs").PlayerRangeSummary[]} currentPeriodPlayerRangeSummaries
 */

/**
 * @typedef {Object.<string, Object.<string, SubstitutionLogEntry>>} SubstitutionLog
 */

/**
 * @typedef {object} SubstitutionLogEntry
 * @property {string} subbedByPlayer
 * @property {string} subbedForPlayer
 * @property {string} subbedForPosition
 * @property {string} starterGameDateString
 * @property {Dayjs} starterGameDateObject
 * @property {PlayerGameStatus} gameStatus
 */

/**
 * @typedef {Object.<string, string[]>} ReserveMapping
 */

/**
 * @typedef {object} PlayerGameStatus
 * @property {import("../bballScraper.mjs").PlayerGameLogEntry} activeGame
 * @property {boolean} gameHasBeenPlayed
 * @property {boolean} wasActiveForGame
 * @property {import("../bballScraper.mjs").PlayerGameLogEntry} inactiveGame
 */


/**
 * Add a player transaction to the team's transaction log.
 * @param {Team} team
 * @param {PlayerTransaction} playerTransaction
 */
const addTransaction = (team, playerTransaction) => {
    if(team.transactions) {
        team.transactions.push(playerTransaction);
    } else {
        team.transactions = [];
        team.transactions.push(playerTransaction);
    }
};

module.exports.addTransaction = addTransaction;