const User = require('../models/User');

exports.getScores = async (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ highScore: user.highScore, dailyScore: user.dailyScore });
};

exports.updateScore = async (req, res) => {
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
};