require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error(err));

// Define User Schema
const UserSchema = new mongoose.Schema({
    userId: String,
    username: String,
    coins: { type: Number, default: 0 },
    referrals: { type: Number, default: 0 },
    joinDate: { type: Date, default: Date.now },
    lastCoinUpdate: { type: Date, default: null },
    coinsToday: { type: Number, default: 0 },
    referredBy: { type: String, default: null }
});
const User = mongoose.model('User', UserSchema);

// 📌 API: Update Coins from Game
app.post('/update-coins', async (req, res) => {
    const { userId, coins } = req.body;
    if (!userId || coins === undefined) return res.status(400).json({ error: 'Missing data' });

    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const today = new Date().toDateString();
    const lastUpdate = user.lastCoinUpdate ? new Date(user.lastCoinUpdate).toDateString() : null;

    if (lastUpdate !== today) {
        user.coinsToday = 0;  // Reset daily coins
    }

    const remainingCoins = Math.max(0, 100 - user.coinsToday);
    const coinsToAdd = Math.min(coins, remainingCoins);

    if (coinsToAdd > 0) {
        user.coins += coinsToAdd;
        user.coinsToday += coinsToAdd;
        user.lastCoinUpdate = new Date();
        await user.save();
    }

    res.json({ success: true, coinsAdded: coinsToAdd });
});

// 📌 API: Get Leaderboard
app.get('/leaderboard', async (req, res) => {
    const leaderboard = await User.find({ referrals: { $gte: 5 } })
        .sort({ coins: -1, referrals: -1, joinDate: 1 })
        .limit(100);
    res.json(leaderboard);
});

// 📌 Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));