const leagueData = require('../library/core/leagueData.cjs');
const teamTimeline = require('../library/core/teamTimeline.cjs');
const dayjs = require('dayjs');

test('Percentage category test', () => {

    const leagueStartDate = dayjs("2022-10-18");

    /** @type {import('../library/core/team.cjs').Team} */
    const teamOne = {
      name: "t1",
      players: {
        "guardOne": {
          "name": "Guard One",
          "bbrefId": "g1",
          gameLog: [
            {"rank": 1, "gameDateString": "2022-10-18", gameDateObject: dayjs("2022-10-18"), "fieldGoals": 3, "fieldGoalAttempts": 10, "turnOvers": 0, "points": 50, "assists": 5, "rebounds": 6, "blocks": 1},
            {"rank": 2, "gameDateString": "2022-10-20", gameDateObject: dayjs("2022-10-20"), "fieldGoals": 0, "fieldGoalAttempts": 0, "turnOvers": 10, "points": 0, "assists": 5, "rebounds": 6, "blocks": 0}
          ],
          inactiveGameLog: []
        }
      },
      transactions: []
    };

    /** @type {import('../library/core/team.cjs').Team} */
    const teamTwo = {
      name: "t2",
      players: {
        "guardOne": {
          "name": "Guard One",
          "bbrefId": "g1",
          gameLog: [
            {"rank": 1, "gameDateString": "2022-10-18", gameDateObject: dayjs("2022-10-18"), "fieldGoals": 12, "fieldGoalAttempts": 12, "turnOvers": 10, "points": 34, "assists": 8, "rebounds": 6, "blocks": 1},
            {"rank": 2, "gameDateString": "2022-10-20", gameDateObject: dayjs("2022-10-20"), "fieldGoals": 0, "fieldGoalAttempts": 8, "turnOvers": 1, "points": 1, "assists": 0, "rebounds": 6, "blocks": 0}
          ],
          inactiveGameLog: []
        }
      },
      transactions: []
    };

    /** @type {import('../library/core/team.cjs').Team} */
    const teamThree = {
      name: "t3",
      players: {
        "guardOne": {
          "name": "Guard One",
          "bbrefId": "g1",
          gameLog: [
            {"rank": 1, "gameDateString": "2022-10-20", gameDateObject: dayjs("2022-10-20"), "fieldGoals": 9, "fieldGoalAttempts": 10, "turnOvers": 3, "points": 20, "assists": 8, "rebounds": 0, "blocks": 1}
          ],
          inactiveGameLog: []
        }
      },
      transactions: []
    };
    const countingCategories = ["fieldGoals", "fieldGoalAttempts", "turnOvers", "points", "assists", "rebounds", "blocks"];
    const percentageCategories = [{name: "fg%", numerator: "fieldGoals", denominator: "fieldGoalAttempts"}];
    const positiveCategories = ["fg%", "points", "assists", "blocks", "rebounds"];
    const negativeCategories = ["turnOvers"];

    const myStartingPositions = ["guardOne"];
    const myReservePositions = [];
    const reserveMapping = {
            'guardOne': []
    };

    const timelineOne = teamTimeline.buildTeamTimeline(teamOne, leagueStartDate, myStartingPositions, myReservePositions);
    const teamRangeSummaryOne = teamTimeline.getTeamRangeSummary(timelineOne, teamOne, myStartingPositions, leagueStartDate, dayjs("2022-10-22"), countingCategories, reserveMapping, percentageCategories);

    const timelineTwo = teamTimeline.buildTeamTimeline(teamTwo, leagueStartDate, myStartingPositions, myReservePositions);
    const teamRangeSummaryTwo = teamTimeline.getTeamRangeSummary(timelineTwo, teamTwo, myStartingPositions, leagueStartDate, dayjs("2022-10-22"), countingCategories, reserveMapping, percentageCategories);

    const timelineThree = teamTimeline.buildTeamTimeline(teamThree, leagueStartDate, myStartingPositions, myReservePositions);
    const teamRangeSummaryThree = teamTimeline.getTeamRangeSummary(timelineThree, teamThree, myStartingPositions, leagueStartDate, dayjs("2022-10-22"), countingCategories, reserveMapping, percentageCategories);

    var leaderboard = leagueData.calculateLeaderboard([teamRangeSummaryOne, teamRangeSummaryTwo, teamRangeSummaryThree], positiveCategories, negativeCategories);

    // team 1: 30% fg, 50 points, 10 turnovers
    // team 2: 60% fg, 35 points, 11 turnovers
    // team 3: 90% fg, 20 points, 3 turnovers

    var fgPercentageLeaderboard = leaderboard.find(l => l.category == "fg%");
    expect(fgPercentageLeaderboard.orderedTeams[0].points).toBe(3);
    expect(fgPercentageLeaderboard.orderedTeams[0].name).toBe("t3");
    expect(fgPercentageLeaderboard.orderedTeams[0].total).toBe(90);
    expect(fgPercentageLeaderboard.orderedTeams[1].points).toBe(2);
    expect(fgPercentageLeaderboard.orderedTeams[1].name).toBe("t2");
    expect(fgPercentageLeaderboard.orderedTeams[1].total).toBe(60);
    expect(fgPercentageLeaderboard.orderedTeams[2].points).toBe(1);
    expect(fgPercentageLeaderboard.orderedTeams[2].name).toBe("t1");
    expect(fgPercentageLeaderboard.orderedTeams[2].total).toBe(30);

    var pointsPercentageLeaderboard = leaderboard.find(l => l.category == "points");
    expect(pointsPercentageLeaderboard.orderedTeams[0].points).toBe(3);
    expect(pointsPercentageLeaderboard.orderedTeams[0].name).toBe("t1");
    expect(pointsPercentageLeaderboard.orderedTeams[0].total).toBe(50);
    expect(pointsPercentageLeaderboard.orderedTeams[1].points).toBe(2);
    expect(pointsPercentageLeaderboard.orderedTeams[1].name).toBe("t2");
    expect(pointsPercentageLeaderboard.orderedTeams[1].total).toBe(35);
    expect(pointsPercentageLeaderboard.orderedTeams[2].points).toBe(1);
    expect(pointsPercentageLeaderboard.orderedTeams[2].name).toBe("t3");
    expect(pointsPercentageLeaderboard.orderedTeams[2].total).toBe(20);

    var turnOversPercentageLeaderboard = leaderboard.find(l => l.category == "turnOvers");
    expect(turnOversPercentageLeaderboard.orderedTeams[0].points).toBe(3);
    expect(turnOversPercentageLeaderboard.orderedTeams[0].name).toBe("t3");
    expect(turnOversPercentageLeaderboard.orderedTeams[0].total).toBe(3);
    expect(turnOversPercentageLeaderboard.orderedTeams[1].points).toBe(2);
    expect(turnOversPercentageLeaderboard.orderedTeams[1].name).toBe("t1");
    expect(turnOversPercentageLeaderboard.orderedTeams[1].total).toBe(10);
    expect(turnOversPercentageLeaderboard.orderedTeams[2].points).toBe(1);
    expect(turnOversPercentageLeaderboard.orderedTeams[2].name).toBe("t2");
    expect(turnOversPercentageLeaderboard.orderedTeams[2].total).toBe(11);

    // bottom two teams tied in a category
    // team 1: 10 assists, team 2: 8 assists, team 3: 8 assists
    var assistsPercentageLeaderboard = leaderboard.find(l => l.category == "assists");
    expect(assistsPercentageLeaderboard.orderedTeams[0].points).toBe(3);
    expect(assistsPercentageLeaderboard.orderedTeams[0].name).toBe("t1");
    expect(assistsPercentageLeaderboard.orderedTeams[1].points).toBe(1.5);
    expect(assistsPercentageLeaderboard.orderedTeams[2].points).toBe(1.5);
    
    // top two teams tied in a category
    // team 1: 12 rebounds, team 2: 12 rebounds, team 3: 0 rebounds
    var reboundsPercentageLeaderboard = leaderboard.find(l => l.category == "rebounds");
    expect(reboundsPercentageLeaderboard.orderedTeams[0].points).toBe(2.5);
    expect(reboundsPercentageLeaderboard.orderedTeams[1].points).toBe(2.5);
    expect(reboundsPercentageLeaderboard.orderedTeams[2].name).toBe("t3");
    expect(reboundsPercentageLeaderboard.orderedTeams[2].points).toBe(1);

    // all three teams tied in a category: 1 block
    var blocksPercentageLeaderboard = leaderboard.find(l => l.category == "blocks");
    expect(blocksPercentageLeaderboard.orderedTeams[0].points).toBe(2);
    expect(blocksPercentageLeaderboard.orderedTeams[1].points).toBe(2);
    expect(blocksPercentageLeaderboard.orderedTeams[2].points).toBe(2);


    // t1 = 13.5pts, t2 = 11 pts, t3=11.5 pts
    const allTeams = [teamThree, teamTwo, teamOne];
    leagueData.calculateTeamPointsAndSort(allTeams, leaderboard);
    expect(allTeams[0].name).toBe("t1");
    expect(allTeams[1].name).toBe("t3");
    expect(allTeams[2].name).toBe("t2");
    expect(allTeams[0].points).toBe(13.5);
    expect(allTeams[1].points).toBe(11.5);
    expect(allTeams[2].points).toBe(11);
});