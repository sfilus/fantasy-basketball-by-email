/**
 * Stats for a single game for a player.
 * @typedef {Object} PlayerGameLogEntry
 * @property {string} playerBbrefId
 * @property {string} rank
 * @property {string} gameDateString
 * @property {Dayjs} gameDateObject
 * @property {string} fieldGoals
 * @property {string} fieldGoalAttempts
 * @property {string} threePointers
 * @property {string} threePointerAttempts
 * @property {string} freeThrows
 * @property {string} freeThrowAttempts
 * @property {string} rebounds
 * @property {string} assists
 * @property {string} steals
 * @property {string} blocks
 * @property {string} turnOvers
 * @property {string} points
 * @property {string} gameScore
 */

/**
 * Stats for a single game for a player.
 * @typedef {Object} InactivePlayerGameLogEntry
 * @property {string} rank
 * @property {string} reason
 * @property {string} gameDateString
 * @property {Dayjs} gameDateObject
 */

/**
 * The game logs (full season + currentPeriod + inactive) for a player.
 * @typedef {Object} PlayerGameLog
 * @property {PlayerGameLogEntry[]} season
 * @property {InactivePlayerGameLogEntry[]} inactiveGameLog
 * @property {PlayerGameLogEntry[]} currentPeriod
 */

/**
 * Retrieve the player full year game logs for a given player.
 * @param {string} playerId basketball reference player id
 * @param {Number} bbrefYear basketball reference year
 * @param {Dayjs} currentPeriodStart start date of the current active period 
 * @param {Dayjs} currentPeriodEnd end date of the current active period
 * @returns {Promise<PlayerGameLog>} a promise of the PlayerGameLog
 */


import playwright from 'playwright';
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import isBetween from 'dayjs/plugin/isBetween.js';
const {Dayjs} = dayjs;

dayjs.extend(customParseFormat)
dayjs.extend(isBetween);


const getPlayerGameLogURL = (playerId, bbrefYear) => {
        var firstLetter = playerId.substring(0, 1);
        return 'https://www.basketball-reference.com/players/' + firstLetter + '/'+ playerId +'/gamelog/' + bbrefYear;
};


/**
 * 
 * @param {import('playwright').Page} page 
 * @param {string} playerId 
 * @param {number} bbrefYear 
 * @param {Dayjs} currentPeriodStart 
 * @param {Dayjs} currentPeriodEnd 
 * @returns 
 */
const getPlayerGameLog = async (page, playerId, bbrefYear, currentPeriodStart, currentPeriodEnd) => {
        const playerUrl = getPlayerGameLogURL(playerId, bbrefYear);
        console.log(playerUrl);
        await page.goto(playerUrl, {waitUntil:'domcontentloaded', referer: "https://www.basketball-reference.com/players/", timeout: 60000});
        await page.waitForSelector('div#all_game_log_summary', {timeout: 60000, state: 'attached'});

        const playerGameLogs = await page.$$eval('table#pgl_basic tbody tr', allRows => {
                return new Promise(function(resolve, reject) {

                        //This code runs inside the browser. (So for example, we won't have our node imports available inside this function.)
                        var gameLog = [];
                        var inactiveGameLog = [];
                        var currentPeriodGameLog = [];

                        allRows.forEach(element => {
                                const getStat = (row, dataStat) => {
                                        var el = row.querySelector('td[data-stat='+ dataStat +']');
                                        if(el) {
                                                return el.textContent;
                                        } 
                                        return null;
                                };

                                const getGameRank = (row) => {
                                        var el = row.querySelector('th[data-stat=ranker]');
                                        if(el) {
                                                return el.textContent;
                                        } 
                                        return null;
                                };

                                const isHeadRow = (row) => {
                                        return row.classList.contains('thead');
                                };

                                const isInactiveRow = (row) => {
                                        var el = row.querySelector('td[data-stat=reason]');
                                        if(el) {
                                                return true;
                                        }
                                        return false;
                                };

                                if(isHeadRow(element) == false && isInactiveRow(element) == false) {
                                        var game = {};
                                        game.rank = getGameRank(element);
                                        game.gameDateString = getStat(element, 'date_game');
                                        game.fieldGoals = getStat(element, 'fg');
                                        game.fieldGoalAttempts = getStat(element, 'fga');
                                        game.threePointers = getStat(element, 'fg3');
                                        game.threePointerAttempts = getStat(element, 'fg3a');
                                        game.freeThrows = getStat(element, 'ft');
                                        game.freeThrowAttempts = getStat(element, 'fta');
                                        game.rebounds = getStat(element, 'trb');
                                        game.assists = getStat(element, 'ast');
                                        game.steals = getStat(element, 'stl');
                                        game.blocks = getStat(element, 'blk');
                                        game.turnOvers = getStat(element, 'tov');
                                        game.points = getStat(element, 'pts');
                                        game.gameScore = getStat(element, 'game_score');
                                        gameLog.push(game);


                                } else if (isHeadRow(element) == false && isInactiveRow(element) == true) {
                                        var inactiveGame = {};
                                        inactiveGame.rank = getGameRank(element);
                                        inactiveGame.reason = getStat(element, 'reason');
                                        inactiveGame.gameDateString = getStat(element, 'date_game');
                                        inactiveGameLog.push(inactiveGame);
                                }
                        });

                        resolve({season: gameLog, inactiveGameLog: inactiveGameLog, currentPeriod: currentPeriodGameLog});

                });
        });

        playerGameLogs.season.forEach(game => {
                game.gameDateObject = dayjs(game.gameDateString, "YYYY-MM-DD")
                game.playerBbrefId = playerId;
                if(game.gameDateObject.isBetween(currentPeriodStart, currentPeriodEnd, 'day', '[)')) {
                        playerGameLogs.currentPeriod.push(game);
                }
        });
        playerGameLogs.inactiveGameLog.forEach(game => {
                game.playerBbrefId = playerId;
                game.gameDateObject = dayjs(game.gameDateString, "YYYY-MM-DD")
        });

        return playerGameLogs;
};

/**
 * @param {import('./core/team.cjs').Team} team
 * @param {string[]} startingPositions
 * @param {string[]} reservePositions
 * @returns {Set<string>}
 */
export const getCompleteSetOfPlayerBbrefIdsThatHavePlayedOnTeam = (team, startingPositions, reservePositions) => {
        var bbrefs = new Set();
        for(var startPos of startingPositions) {
                bbrefs.add(team.players[startPos].bbrefId);
        }
        for(var resPos of reservePositions) {
                bbrefs.add(team.players[resPos].bbrefId);
        }
        for(var playerTransaction of team.transactions) {
                bbrefs.add(playerTransaction.player.bbrefId);
        }
        return bbrefs;
}

/**
 * @param {Team[]} teams 
 * @param {string[]} startingPositions 
 * @param {string[]} reservePositions 
 * @param {number} bbrefYear 
 * @param {Dayjs} currentPeriodStart start date of the current active period 
 * @param {Dayjs} currentPeriodEnd end date of the current active period
 * @returns {Promise<Map<string, PlayerGameLog>>}
 */
export const getGameLogMapForEveryPlayerInLeague = async (teams, startingPositions, reservePositions, bbrefYear, currentPeriodStart, currentPeriodEnd) => {
        var playerGameLogMap = new Map();
        var leagueSetOfPlayers = new Set();

        const browser = await playwright.chromium.launch({
                headless: false
        });
        var page = await browser.newPage();

        for(var team of teams) {
                var teamPlayers = getCompleteSetOfPlayerBbrefIdsThatHavePlayedOnTeam(team, startingPositions, reservePositions);
                teamPlayers.forEach((player) => leagueSetOfPlayers.add(player));
        }
        for(var player of leagueSetOfPlayers) {
                var retryAttempts = 1;
                var complete = false;

                while(retryAttempts <= 5 && complete == false) {
                        try {
                                var playerGameLog = await getPlayerGameLog(page, player, bbrefYear, currentPeriodStart, currentPeriodEnd);
                                playerGameLogMap.set(player, playerGameLog)
                                complete = true;
                                console.log("Complete: " + player);
                        } catch (error) {
                                console.log("Failed stat scrape attempt number " + retryAttempts + " for player: " + player);
                                console.log(error);
                                retryAttempts++;
                                await page.close();
                                page = await browser.newPage();
                                await page.waitForTimeout(4000); // wait for 10 seconds between requests to bbref
                        }
                }

                await page.waitForTimeout(4000); // wait for 10 seconds between requests to bbref
        }
        await browser.close();
        return playerGameLogMap;
};

/**
 * Return the team object with player game logs populated for every position.
 * @param {import('./core/team.cjs').Team} team
 * @param {string[]} startingPositions 
 * @param {string[]} reservePositions 
 * @param {Map<string, PlayerGameLog>} gameLogMapForEveryPlayerInLeague 
 * @returns {Team} Team with players game logs populated.
 */
export const getTeamGameLogs = (team, startingPositions, reservePositions, gameLogMapForEveryPlayerInLeague) => {
        var populatedTeam = team;
        var allPositions = startingPositions.concat(reservePositions);

        allPositions.forEach(pos => {
                var playerBbrefId = team.players[pos].bbrefId;
                var playerGameLog = gameLogMapForEveryPlayerInLeague.get(playerBbrefId);
                populatedTeam.players[pos].gameLog = playerGameLog.season;
                populatedTeam.players[pos].gameLogCurrentPeriod = playerGameLog.currentPeriod;
                populatedTeam.players[pos].inactiveGameLog = playerGameLog.inactiveGameLog;
        });

        team.transactions.forEach(transaction => {
                var playerGameLog  = gameLogMapForEveryPlayerInLeague.get(transaction.player.bbrefId);
                transaction.player.gameLog = playerGameLog.season;
                transaction.player.gameLogCurrentPeriod = playerGameLog.currentPeriod;
                transaction.player.inactiveGameLog = playerGameLog.inactiveGameLog;
        });

        return populatedTeam;
}