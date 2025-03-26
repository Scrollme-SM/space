require('dotenv').config(); // Load environment variables first

const PORT = process.env.PORT || 3000;
const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cron = require('node-cron');

const app = express();
app.use(express.json());

// 📌 Connect to MongoDB with detailed error logging
console.log("Connecting to MongoDB:", process.env.MONGO_URI);

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('✅ MongoDB Connected Successfully!'))
    .catch(err => {
        console.error('❌ MongoDB Connection Failed:', err.message);
        process.exit(1); // Exit process on DB failure
    });

// 📌 Define User Schema
const UserSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    coins: { type: Number, default: 0 },
    highScore: { type: Number, default: 0 },
    dailyScore: { type: Number, default: 0 },
    referrals: { type: Number, default: 0 },
    joinDate: { type: Date, default: Date.now },
    lastCoinUpdate: { type: Date, default: null }
});
const User = mongoose.model('User', UserSchema);

// 📌 Token Conversion Request Schema
const TokenRequestSchema = new mongoose.Schema({
    userId: String,
    username: String,
    coinsRequested: Number,
    tokenAmount: Number,
    status: { type: String, default: "Pending" }, // Pending, Approved, Rejected
    requestDate: { type: Date, default: Date.now }
});
const TokenRequest = mongoose.model("TokenRequest", TokenRequestSchema);

// 📌 API: Fetch User Scores
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
        chat_id: process.env.TELEGRAM_CHAT_ID, // Secure chat ID
        text: message,
        parse_mode: "Markdown"
    });

    console.log("✅ Leaderboard posted in Telegram group");
}

// 📌 Cron Job to Reset Leaderboard Monthly
cron.schedule("0 0 1 * *", async () => {
    console.log("🔄 Resetting leaderboard for new month...");
    await postLeaderboard();
    await User.updateMany({}, { $set: { dailyScore: 0 } });
    console.log("✅ Leaderboard reset for the new month.");
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

// 📌 API: Request Token Conversion
app.post("/request-token-conversion", async (req, res) => {
    const { userId, username, coinsRequested } = req.body;
    const conversionRate = 0.01; // 1 coin = 0.01 SM tokens

    if (!userId || !coinsRequested) return res.status(400).json({ error: "Missing data" });

    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (coinsRequested > user.coins) return res.status(400).json({ error: "Not enough coins" });

    const tokenAmount = coinsRequested * conversionRate;

    const request = new TokenRequest({ userId, username, coinsRequested, tokenAmount });
    await request.save();

    res.json({ success: true, message: "Token conversion request submitted." });
});

// 📌 API: Approve Token Conversion (Admin Only)
app.post("/approve-token-conversion", async (req, res) => {
    const { requestId, adminPassword } = req.body;
    if (adminPassword !== process.env.ADMIN_PASS) return res.status(403).json({ error: "Unauthorized" });

    const request = await TokenRequest.findById(requestId);
    if (!request) return res.status(404).json({ error: "Request not found" });

    if (request.status !== "Pending") return res.status(400).json({ error: "Already processed" });

    const user = await User.findOne({ userId: request.userId });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.coins < request.coinsRequested) return res.status(400).json({ error: "Insufficient coins" });

    user.coins -= request.coinsRequested;
    await user.save();

    request.status = "Approved";
    await request.save();

    res.json({ success: true, message: `✅ Approved! Send ${request.tokenAmount} SM tokens to ${user.username}.` });
});

// 📌 API: Check Token Request Status
app.get("/check-token-status", async (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    const requests = await TokenRequest.find({ userId }).sort({ requestDate: -1 });
    res.json(requests);
});
// 📌 API: Add a New User
app.post('/add-user', async (req, res) => {
    const { userId, username, coins, highScore, dailyScore, referrals } = req.body;

    if (!userId || !username) return res.status(400).json({ error: 'Missing userId or username' });

    try {
        const existingUser = await User.findOne({ userId });
        if (existingUser) return res.status(400).json({ error: 'User already exists' });

        const newUser = new User({
            userId,
            username,
            coins: coins || 0,
            highScore: highScore || 0,
            dailyScore: dailyScore || 0,
            referrals: referrals || 0
        });

        await newUser.save();
        res.json({ success: true, message: "User added successfully", user: newUser });
    } catch (error) {
        res.status(500).json({ error: "Failed to add user" });
    }
});
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));