const pug = require('pug');
const nodemailer = require('nodemailer');


module.exports.renderEmailText = function(leagueName, leaderboard, populatedTeams, gameOfTheCurrentPeriod, playerOfTheCurrentPeriod, startingPositions, reservePositions, heatmapFilename, barChartFilename) {
    return pug.renderFile('current-period-update-template.pug', {
            leagueName: leagueName,
            leaderboard: leaderboard,
            teams: populatedTeams,
            startingPositions: startingPositions,
            reservePositions: reservePositions,
            heatmapFilename: heatmapFilename,
            barChartFilename: barChartFilename,
            gameOfTheCurrentPeriod: gameOfTheCurrentPeriod,
            playerOfTheCurrentPeriod: playerOfTheCurrentPeriod
    });
};

module.exports.getEmailSubjectLine = function(leagueName) {
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0
    var yyyy = today.getFullYear();
    var stringDate = mm + '/' + dd + '/' + yyyy;
    return leagueName + " update - " + stringDate;
};

module.exports.sendEmail = async function(subjectLine, emailHtml, heatmap, teamCharts, recipientList, barChart){
    console.log("HOST: " + process.env.BBALL_HOST);

    var transporter = nodemailer.createTransport({
            host: process.env.BBALL_HOST,
            port: process.env.BBALL_PORT,
            secure: true,
            auth: {
                    user: process.env.BBALL_ACCOUNT,
                    pass: process.env.BBALL_KEY
            }
    });

    var emailAttachments = [];

    emailAttachments.push({
        filename: heatmap.filename,
        content: heatmap.stream,
        cid: heatmap.filename,
        contentType: "image/png"
    });

    emailAttachments.push({
        filename: barChart.filename,
        content: barChart.stream,
        cid: barChart.filename,
        contentType: "image/png"
    });

    for(var tc of teamCharts) {
        emailAttachments.push({
            filename: tc.filename,
            content: tc.stream,
            cid: tc.filename,
            contentType: "image/png"
        });
    }

    var info = await transporter.sendMail({
            from: process.env.BBALL_SEND,
            to: recipientList,
            subject: subjectLine,
            html: emailHtml,
            attachments: emailAttachments
    });
    return info.messageId;
};