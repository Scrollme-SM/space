const User = require('../models/User');

// Get the top 10 players based on high score
exports.getTopPlayers = async (req, res) => {
    try {
        const topPlayers = await User.find().sort({ highScore: -1 }).limit(10);
        res.json(topPlayers);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch leaderboard data." });
    }
};

// Get the daily leaderboard (sorted by dailyScore)
exports.getDailyLeaderboard = async (req, res) => {
    try {
        const topDailyPlayers = await User.find().sort({ dailyScore: -1 }).limit(10);
        res.json(topDailyPlayers);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch daily leaderboard." });
    }
};