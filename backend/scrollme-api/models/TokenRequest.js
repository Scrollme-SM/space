const mongoose = require('mongoose');

const TokenRequestSchema = new mongoose.Schema({
    userId: String,
    username: String,
    coinsRequested: Number,
    tokenAmount: Number,
    status: { type: String, default: "Pending" },
    requestDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model("TokenRequest", TokenRequestSchema);
