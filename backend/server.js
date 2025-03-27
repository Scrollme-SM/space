require('dotenv').config(); // Load environment variables

const express = require('express');
const connectDB = require('./scrollme-api/config/db');

// Import routes
const userRoutes = require('./routes/userRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const tokenRoutes = require('./routes/tokenRoutes');

// Import cron jobs (ensures scheduled tasks start when server runs)
require('./utils/cronJobs');

const app = express();
app.use(express.json());

// Connect to MongoDB
connectDB();

// Define Routes
app.use('/api/users', userRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/tokens', tokenRoutes);

// Root Endpoint
app.get("/", (req, res) => {
    res.json({
        message: "🚀 Welcome to ScrollMe API!",
        routes: {
            getScores: "/api/users/get-scores",
            updateScore: "/api/users/update-score",
            leaderboard: "/api/leaderboard",
            tokens: "/api/tokens"
        }
    });
});

// Start the Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
