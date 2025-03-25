require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cron = require('node-cron');

const app = express();
app.use(express.json());

// 📌 Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error(err));

// 📌 Define User Schema
const UserSchema = new mongoose.Schema({
    userId: String,
    username: String,
    coins: { type: Number, default: 0 },
    highScore: { type: Number, default: 0 },
    dailyScore: { type: Number, default: 0 },
    referrals: { type: Number, default: 0 },
    joinDate: { type: Date, default: Date.now },
    lastCoinUpdate: { type: Date, default: null }
});
const User = mongoose.model('User', UserSchema);

// 📌 API: Fetch High Score & Daily Score
app.get('/get-scores', async (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ highScore: user.highScore, dailyScore: user.dailyScore });
});

// 📌 API: Update Score (Max 100 Daily)
app.post('/update-score', async (req, res) => {
    const { userId, score } = req.body;
    if (!userId || score === undefined) return res.status(400).json({ error: 'Missing data' });

    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const today = new Date().toDateString();
    const lastUpdate = user.lastCoinUpdate ? new Date(user.lastCoinUpdate).toDateString() : null;

    if (lastUpdate !== today) {
        user.dailyScore = 0; // Reset daily score if a new day starts
    }

    const remainingCoins = Math.max(0, 100 - user.dailyScore);
    const coinsToAdd = Math.min(score, remainingCoins);

    if (coinsToAdd > 0) {
        user.coins += coinsToAdd;
        user.dailyScore += coinsToAdd;
        user.highScore = Math.max(user.highScore, user.coins);
        user.lastCoinUpdate = new Date();
        await user.save();
    }

    res.json({ success: true, coinsAdded: coinsToAdd });
});

// 📌 API: Fetch Top 100 Players for Leaderboard
app.get('/leaderboard', async (req, res) => {
    const leaderboard = await User.find({ referrals: { $gte: 5 } })
        .sort({ dailyScore: -1, referrals: -1, joinDate: 1 })
        .limit(100);
    res.json(leaderboard);
});

// 📌 Function to Post Leaderboard in Telegram Group
async function postLeaderboard() {
    const topPlayers = await User.find({ referrals: { $gte: 5 } })
        .sort({ dailyScore: -1 })
        .limit(100);

    let message = "🏆 *ScrollMe Leaderboard – Top 100 Players* 🏆\n\n";
    topPlayers.forEach((player, index) => {
        message += `${index + 1}. ${player.username} – ${player.dailyScore} coins\n`;
    });

    await axios.post(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
        chat_id: "@YourTelegramGroup",
        text: message,
        parse_mode: "Markdown"
    });

    console.log("Leaderboard posted in Telegram group");
}

// 📌 Cron Job to Reset Leaderboard Monthly
cron.schedule("0 0 1 * *", async () => {
    console.log("Resetting leaderboard for new month...");

    await postLeaderboard();

    await User.updateMany({}, { $set: { dailyScore: 0 } });

    console.log("Leaderboard reset for the new month.");
});

// 📌 API: Manually Reset Leaderboard
app.post('/reset-leaderboard', async (req, res) => {
    try {
        await postLeaderboard();
        await User.updateMany({}, { $set: { dailyScore: 0 } });
        res.json({ success: true, message: "Leaderboard reset manually" });
    } catch (error) {
        res.status(500).json({ error: "Error resetting leaderboard" });
    }
});

// 📌 Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));