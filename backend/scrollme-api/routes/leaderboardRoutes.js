const express = require('express');
const { getTopPlayers, getDailyLeaderboard } = require('../controllers/leaderboardController');

const router = express.Router();

router.get('/top-players', getTopPlayers);
router.get('/daily-leaderboard', getDailyLeaderboard);

module.exports = router;
