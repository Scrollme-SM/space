const mongoose = require('mongoose');

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

module.exports = mongoose.model('User', UserSchema);