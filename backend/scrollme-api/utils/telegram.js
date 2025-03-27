const axios = require('axios');
const User = require('../models/User');

exports.postLeaderboard = async () => {
    const topPlayers = await User.find({ referrals: { $gte: 5 } })
        .sort({ dailyScore: -1 })
        .limit(100);

    let message = "🏆 *ScrollMe Leaderboard – Top 100 Players* 🏆\n\n";
    topPlayers.forEach((player, index) => {
        message += `${index + 1}. ${player.username} – ${player.dailyScore} coins\n`;
    });

    await axios.post(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: "Markdown"
    });

    console.log("✅ Leaderboard posted in Telegram group");
};