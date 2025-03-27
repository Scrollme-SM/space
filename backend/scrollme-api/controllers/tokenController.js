const TokenRequest = require('../models/TokenRequest');

// Request token conversion
exports.requestTokens = async (req, res) => {
    const { userId, username, coinsRequested } = req.body;

    if (!userId || !coinsRequested) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const tokenAmount = coinsRequested / 1000; // Example conversion rate (1 token = 1000 coins)
    
    try {
        const request = new TokenRequest({ userId, username, coinsRequested, tokenAmount });
        await request.save();
        res.json({ success: true, message: "Token request submitted successfully." });
    } catch (error) {
        res.status(500).json({ error: "Failed to submit token request." });
    }
};

// Get all pending token requests (for admin approval)
exports.getPendingRequests = async (req, res) => {
    try {
        const pendingRequests = await TokenRequest.find({ status: "Pending" });
        res.json(pendingRequests);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch token requests." });
    }
};

// Approve a token request
exports.approveRequest = async (req, res) => {
    const { requestId } = req.body;

    if (!requestId) {
        return res.status(400).json({ error: "Request ID is required" });
    }

    try {
        const request = await TokenRequest.findById(requestId);
        if (!request) return res.status(404).json({ error: "Request not found" });

        request.status = "Approved";
        await request.save();

        res.json({ success: true, message: "Token request approved." });
    } catch (error) {
        res.status(500).json({ error: "Failed to approve request." });
    }
};