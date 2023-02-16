const dayjs = require('dayjs');
const teamTimeline = require('../library/core/teamTimeline.cjs');

test('Sub log management.', () => {
  /** @type {import('../library/core/teamTimeline.cjs').AvailableSubstituteGame[]} */
  const sublog = [];
  
  /** @type {import('../library/core/teamTimeline.cjs').AvailableSubstituteGame} */
  const availableGame = {
    gameRank: 1,
    reservePlayerBbrefId: "fakePlayer1"
  };

  var game = teamTimeline.getFirstAvailableSubLogGame(sublog, [availableGame]);
  expect(game.gameRank).toBe(1);
  sublog.push(game);
  expect(sublog.length).toBe(1);

  var game2 = teamTimeline.getFirstAvailableSubLogGame(sublog, [availableGame]);
  expect(game2).toBeNull();
});

test('getTeamRangeSummary with sub and transaction', () => {

    const leagueStartDate = dayjs("2022-10-18");
    /** @type {import('../library/core/team.cjs').Team} */
    const testTeam = {
      players: {
        "guardOne": {
          "name": "Guard One",
          "bbrefId": "g1",
          gameLog: [
            {"rank": 1, "gameDateString": "2022-10-18", gameDateObject: dayjs("2022-10-18"), "assists": 1, "rebounds": 5},
            {"rank": 3, "gameDateString": "2022-10-20", gameDateObject: dayjs("2022-10-20"), "assists": 2, "rebounds": 6}
          ],
          inactiveGameLog: [
            {"rank": 2, gameDateObject: dayjs("2022-10-19"), gameDateString: "2022-10-19", reason: "injury"}
          ]
        },
        "guardTwo": {
          "name": "Guard Two",
          "bbrefId": "g2",
          gameLog: [
            {"rank": 1, "gameDateString": "2022-10-19", gameDateObject: dayjs("2022-10-19"), "assists": 3, "rebounds": 6},
            {"rank": 3, "gameDateString": "2022-10-22", gameDateObject: dayjs("2022-10-22"), "assists": 4, "rebounds": 7}
          ],
          inactiveGameLog: [
            {"rank": 2, gameDateObject: dayjs("2022-10-20"), gameDateString: "2022-10-20", reason: "injury"}
          ]
        },
        "reserveGuard": {
          "name": "Reserve G",
          "bbrefId": "rg1",
          gameLog: [
            {"rank": 1, "gameDateString": "2022-10-18", gameDateObject: dayjs("2022-10-18"), "assists": 1, "rebounds": 2},
            {"rank": 2, "gameDateString": "2022-10-22", gameDateObject: dayjs("2022-10-22"), "assists": 8, "rebounds": 9}
          ]
        }
      },
      transactions: []
    };
    const countingCategories = ["assists", "rebounds"];
    const myStartingPositions = ["guardOne", "guardTwo"];
    const myReservePositions = ["reserveGuard"];
    const reserveMapping = {
            'guardOne': ['reserveGuard'],
            'guardTwo': ['reserveGuard']
    };
    const timeline = teamTimeline.buildTeamTimeline(testTeam, leagueStartDate, myStartingPositions, myReservePositions);
    const teamRangeSummary = teamTimeline.getTeamRangeSummary(timeline, testTeam, myStartingPositions, leagueStartDate, dayjs("2022-10-21"), countingCategories, reserveMapping, [], myReservePositions);
    expect(teamRangeSummary.gamesStartedGameLog.length).toBe(3);
    expect(teamRangeSummary.gamesSubbedGameLog.length).toBe(1);
    expect(teamRangeSummary.categoryTotal["assists"]).toBe(14);
    expect(teamRangeSummary.categoryTotal["rebounds"]).toBe(26);

    const teamRangeSummary2 = teamTimeline.getTeamRangeSummary(timeline, testTeam, myStartingPositions, leagueStartDate, dayjs("2022-10-22"), countingCategories, reserveMapping, [], myReservePositions);
    expect(teamRangeSummary2.gamesStartedGameLog.length).toBe(4);
    expect(teamRangeSummary2.gamesSubbedGameLog.length).toBe(1);
    expect(teamRangeSummary2.categoryTotal["assists"]).toBe(18);
    expect(teamRangeSummary2.categoryTotal["rebounds"]).toBe(33);

    testTeam.transactions.push({
      position: "guardTwo",
      transactionDateObject: dayjs("2022-10-22"),
      transactionDateString:"2022-10-22",
      player: {
        bbrefId: "gtt", 
        name: "g2transaction", 
        gameLog: [
          {"rank": 1, "gameDateString": "2022-10-18", gameDateObject: dayjs("2022-10-18"), "assists": 1, "rebounds": 1},
          {"rank": 2, "gameDateString": "2022-10-21", gameDateObject: dayjs("2022-10-21"), "assists": 2, "rebounds": 2},
          {"rank": 3, "gameDateString": "2022-10-22", gameDateObject: dayjs("2022-10-22"), "assists": 3, "rebounds": 3},
          {"rank": 4, "gameDateString": "2022-10-23", gameDateObject: dayjs("2022-10-23"), "assists": 4, "rebounds": 4}
      ]}
    });

    const timelineWithTransaction = teamTimeline.buildTeamTimeline(testTeam, leagueStartDate, myStartingPositions, myReservePositions);
    const teamRangeSummaryWithTransaction = teamTimeline.getTeamRangeSummary(timelineWithTransaction, testTeam, myStartingPositions, leagueStartDate, dayjs("2022-10-22"), countingCategories, reserveMapping, [], myReservePositions);

    expect(teamRangeSummaryWithTransaction.gamesStartedGameLog.length).toBe(4);
    expect(teamRangeSummaryWithTransaction.gamesSubbedGameLog.length).toBe(1);
    expect(teamRangeSummaryWithTransaction.categoryTotal["assists"]).toBe(17);
    expect(teamRangeSummaryWithTransaction.categoryTotal["rebounds"]).toBe(29);

    const currentlyActivePlayers = teamTimeline.getCurrentlyActivePlayers(timelineWithTransaction, ['guardOne', 'guardTwo']);
    expect(currentlyActivePlayers[0].bbrefId).toBe("g1");
    expect(currentlyActivePlayers[1].bbrefId).toBe("gtt");

});


test('Percentage category test', () => {

    const leagueStartDate = dayjs("2022-10-18");
    /** @type {import('../library/core/team.cjs').Team} */
    const testTeam = {
      players: {
        "guardOne": {
          "name": "Guard One",
          "bbrefId": "g1",
          gameLog: [
            {"rank": 1, "gameDateString": "2022-10-18", gameDateObject: dayjs("2022-10-18"), "fieldGoals": 4, "fieldGoalAttempts": 4},
            {"rank": 3, "gameDateString": "2022-10-20", gameDateObject: dayjs("2022-10-20"), "fieldGoals": 0, "fieldGoalAttempts": 0},
            {"rank": 4, "gameDateString": "2022-10-21", gameDateObject: dayjs("2022-10-21"), "fieldGoals": 0, "fieldGoalAttempts": 6}
          ],
          inactiveGameLog: [
            {"rank": 2, gameDateObject: dayjs("2022-10-19"), gameDateString: "2022-10-19", reason: "injury"}
          ]
        }
      },
      transactions: []
    };
    const countingCategories = ["fieldGoals", "fieldGoalAttempts"];
    const percentageCategories = [{name: "fg%", numerator: "fieldGoals", denominator: "fieldGoalAttempts"}];
    const myStartingPositions = ["guardOne"];
    const myReservePositions = [];
    const reserveMapping = {
            'guardOne': []
    };
    const timeline = teamTimeline.buildTeamTimeline(testTeam, leagueStartDate, myStartingPositions, myReservePositions);
    const teamRangeSummary = teamTimeline.getTeamRangeSummary(timeline, testTeam, myStartingPositions, leagueStartDate, dayjs("2022-10-22"), countingCategories, reserveMapping, percentageCategories, myReservePositions);

    expect(teamRangeSummary.categoryTotal["fieldGoals"]).toBe(4);
    expect(teamRangeSummary.categoryTotal["fieldGoalAttempts"]).toBe(10);
    expect(teamRangeSummary.categoryTotal["fg%"]).toBe(40);


});

test('player range leader test', () => {

    const leagueStartDate = dayjs("2022-10-18");
    /** @type {import('../library/core/team.cjs').Team} */
    const teamOne = {
      players: {
        "guardOne": {
          "name": "Guard One",
          "bbrefId": "g1",
          gameLog: [
            {"rank": 1, "gameDateString": "2022-10-18", gameDateObject: dayjs("2022-10-18"), "gameScore": 11},
            {"rank": 2, "gameDateString": "2022-10-20", gameDateObject: dayjs("2022-10-20"), "gameScore": 11},
            {"rank": 3, "gameDateString": "2022-10-21", gameDateObject: dayjs("2022-10-21"), "gameScore": 11}
          ],
          inactiveGameLog: []
        }
      },
      transactions: []
    };
    const teamTwo = {
      players: {
        "guardOne": {
          "name": "Guard Two",
          "bbrefId": "g2",
          gameLog: [
            {"rank": 1, "gameDateString": "2022-10-18", gameDateObject: dayjs("2022-10-18"), "gameScore": 1},
            {"rank": 2, "gameDateString": "2022-10-20", gameDateObject: dayjs("2022-10-20"), "gameScore": 1},
            {"rank": 3, "gameDateString": "2022-10-21", gameDateObject: dayjs("2022-10-21"), "gameScore": 12}
          ],
          inactiveGameLog: []
        }
      },
      transactions: []
    };
    const countingCategories = [];
    const percentageCategories = [];
    const myStartingPositions = ["guardOne"];
    const myReservePositions = [];
    const reserveMapping = {
            'guardOne': []
    };
    const timelineOne = teamTimeline.buildTeamTimeline(teamOne, leagueStartDate, myStartingPositions, myReservePositions);
    const teamRangeSummaryOne = teamTimeline.getTeamRangeSummary(timelineOne, teamOne, myStartingPositions, leagueStartDate, dayjs("2022-10-22"), countingCategories, reserveMapping, percentageCategories, myReservePositions);
    const timelineTwo = teamTimeline.buildTeamTimeline(teamTwo, leagueStartDate, myStartingPositions, myReservePositions);
    const teamRangeSummaryTwo = teamTimeline.getTeamRangeSummary(timelineTwo, teamOne, myStartingPositions, leagueStartDate, dayjs("2022-10-22"), countingCategories, reserveMapping, percentageCategories, myReservePositions);

    const playerLeaders = teamTimeline.calculatePlayerRangeLeaders([teamRangeSummaryOne, teamRangeSummaryTwo]);
    expect(playerLeaders.playerGameOfThePeriod.bbrefId).toBe("g2");
    expect(playerLeaders.playerGameOfThePeriod.gameScore).toBe(12);
    expect(playerLeaders.playerOfThePeriod.gameScoreSum).toBe(33);
    expect(playerLeaders.playerOfThePeriod.bbrefId).toBe("g1");
    expect(playerLeaders.playerOfThePeriod.averageGameScore).toBe(11);

});

