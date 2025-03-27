const cron = require('node-cron');
const { postLeaderboard } = require('./telegram');
const User = require('../models/User');

cron.schedule("0 0 1 * *", async () => {
    console.log("🔄 Resetting leaderboard for new month...");
    await postLeaderboard();
    await User.updateMany({}, { $set: { dailyScore: 0 } });
    console.log("✅ Leaderboard reset for the new month.");
});